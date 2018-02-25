var exportToView = (function ($) {
    var items;
    var allFieldsInView = [];
    var allData = [];
    var ArrayOfAllFoundVariables = [];
    var termLabelAndGuid = {};
    var taxonomyField = [];
    var spDialogJSLoaded = false;

    var exportView = function (indexOfArray) {
        if (spDialogJSLoaded) {
            SP.UI.ModalDialog.showWaitScreenWithNoClose(SP.Res.dialogLoading15);
        }
        allData = [];
        termLabelAndGuid = {};
        allFieldsInView = getViewFields(indexOfArray);
        var context = SP.ClientContext.get_current();
        var listObject = context.get_web().get_lists().getByTitle(ArrayOfAllFoundVariables[indexOfArray].ListTitle);
        var views = listObject.get_views();
        var view = views.getById(ArrayOfAllFoundVariables[indexOfArray].view.replace(/{/g, '').replace(/}/g, ''));
        context.load(view)
        context.executeQueryAsync(function () {
            console.info('succ');
            var query = new SP.CamlQuery();
            query.set_viewXml("<View><Query>" + view.get_viewQuery() + "</Query></View>");
            items = listObject.getItems(query);
            context.load(items);
            context.executeQueryAsync(function () {
                var itemEnum = items.getEnumerator();
                while (itemEnum.moveNext()) {
                    var currentItem = itemEnum.get_current();
                    var data = {};
                    allFieldsInView.forEach(function (field) {
                        var fieldValue = currentItem.get_item(field.Name);
                        var value = fieldValue;
                        var displayName = field.DisplayName;
                        if (field.Type === "TaxonomyFieldType") {
                            value = fieldValue.get_label();
                            var termGuid = fieldValue.get_termGuid();
                            if (termLabelAndGuid[termGuid] === undefined) {
                                termLabelAndGuid[termGuid] = {};
                                termLabelAndGuid[termGuid]['Label'] = value;
                                termLabelAndGuid[termGuid]['TermGuid'] = termGuid;
                            }
                        }
                        else if (field.Type === "TaxonomyFieldTypeMulti") {
                            var taxMultiValue = fieldValue.getEnumerator();
                            value = [];
                            while (taxMultiValue.moveNext()) {
                                var currentTaxValue = taxMultiValue.get_current();
                                var currentTaxValueLabel = currentTaxValue.get_label();
                                value.push(currentTaxValueLabel);
                                var termGuid = currentTaxValue.get_termGuid();
                                if (termLabelAndGuid[termGuid] === undefined) {
                                    termLabelAndGuid[termGuid] = {};
                                    termLabelAndGuid[termGuid]['Label'] = currentTaxValueLabel;
                                    termLabelAndGuid[termGuid]['TermGuid'] = termGuid;
                                }
                            }
                            value = value.join(';');
                        }
                        else if (field.Type === "User") {
                            value = fieldValue.get_lookupValue();
                        }
                        else if (field.Type === "UserMulti") {
                            if (fieldValue != null) {
                                value = [];
                                fieldValue.forEach(function (userValue) {
                                    value.push(userValue.get_lookupValue());
                                });
                                value = value.join(';');
                            } else {
                                value = "";
                            }
                        }
                        else if (field.Type === "Lookup") {
                            value = fieldValue.get_lookupValue();
                        }
                        else if (field.Type === "LookupMulti") {
                            if (fieldValue.length > 0) {
                                value = [];
                                fieldValue.forEach(function (lookupValue) {
                                    value.push(lookupValue.get_lookupValue());
                                });
                                value = value.join(';');
                            } else {
                                value = "";
                            }

                        }
                        else if (field.Type === "DateTime") {
                            var val = new Date(fieldValue);
                            value = val.toLocaleString();
                        }
                        data[displayName] = value;
                        // data += "'" + displayName + "'" + ":'" + value + "'";
                    });
                    // var jsonData = "{" + data + "}";
                    allData.push(data);
                }

                console.info('All data from view', allData);
                var filterLink = ArrayOfAllFoundVariables[indexOfArray].ListData.FilterLink;
                var filterFields = ArrayOfAllFoundVariables[indexOfArray].ListData.FilterFields;
                if (filterFields != undefined) {
                    alert('With filter');
                    filterFields = filterFields.split(';');
                    filterFields = filterFields.filter(function (x) {
                        return (x !== (undefined || null || ''));
                    });
                    console.info("Filter Fields", filterFields);
                    console.info("Term Label and Guid", termLabelAndGuid);
                    for (var indexOfFilterFields = 0; indexOfFilterFields < filterFields.length; indexOfFilterFields++) {
                        var filterField = filterFields[indexOfFilterFields];
                        var filedDetail = allFieldsInView.filter(function (field, index) {
                            return field.InternalName === filterField;
                        });
                        console.info('Filter Field Detail', filedDetail[0].DisplayName);
                        var isTaxnomyField = taxonomyField.filter(function (field, index) {
                            return field.InternalName === filterField;
                        });
                        if (isTaxnomyField.length > 0) {
                            var filterValue = GetUrlKeyValue('FilterData' + (indexOfFilterFields + 1), false, _spPageContextInfo.webAbsoluteUrl + ArrayOfAllFoundVariables[indexOfArray].ListData.FilterLink);
                            filterValue = filterValue.split(',')
                            var termGuid = filterValue[filterValue.length - 1]
                            console.info("termGuid", termGuid);
                            var termValue = termLabelAndGuid[termGuid]
                            filterValue = termValue['Label'];
                            console.info("filterValue", filterValue);

                            filterData(filedDetail[0].DisplayName, filterValue, filedDetail[0].Type.indexOf('Multi') > -1, filedDetail[0].Type === "DateTime");
                        }
                        else {
                            var filterValue = decodeURIComponent(GetUrlKeyValue('FilterValue' + (indexOfFilterFields + 1), true, _spPageContextInfo.webAbsoluteUrl + ArrayOfAllFoundVariables[indexOfArray].ListData.FilterLink));

                            /**
                             * Check check for multiple value
                             */
                            if (filterValue === "") {
                                var filterValues = decodeURIComponent(GetUrlKeyValue('FilterValues' + (indexOfFilterFields + 1), true, _spPageContextInfo.webAbsoluteUrl + ArrayOfAllFoundVariables[indexOfArray].ListData.FilterLink));
                                if (filterValues != "") {
                                    filterValues = filterValues.split(';#');
                                    console.info("Multi Value filter", filterValues);
                                    filterData(filedDetail[0].DisplayName, filterValues, filedDetail[0].Type.indexOf('Multi') > -1, filedDetail[0].Type === "DateTime");
                                }
                                else {
                                    console.info("filterValue", filterValue);
                                    filterData(filedDetail[0].DisplayName, filterValue, filedDetail[0].Type.indexOf('Multi') > -1, filedDetail[0].Type === "DateTime");
                                }
                            }
                            else {
                                console.info("filterValue", filterValue);
                                filterData(filedDetail[0].DisplayName, filterValue, filedDetail[0].Type.indexOf('Multi') > -1, filedDetail[0].Type === "DateTime");
                            }
                        }
                    }
                    console.info('After Filter', allData);
                    JSONToCSVConvertor(allData, true);
                }
                else {
                    JSONToCSVConvertor(allData, true);
                }
            }, function (sender, args) {
                console.error('error', sender, args)
                if (spDialogJSLoaded) {
                    SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
                }
            });
        }, function (sender, args) {
            console.error('error', sender, args)
            if (spDialogJSLoaded) {
                SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
            }
        })
    }

    var getViewFields = function (indexOfArray) {
        var allFieldsInView = [];
        taxonomyField = [];
        var viewFields = ArrayOfAllFoundVariables[indexOfArray].ListSchema.Field;
        for (var index = 0; index < viewFields.length; index++) {
            var Field = viewFields[index];
            if (Field.FieldType === "TaxonomyFieldType" || Field.FieldType === "TaxonomyFieldTypeMulti") {
                taxonomyField.push({
                    'Name': Field.RealFieldName,
                    'DisplayName': Field.DisplayName,
                    'InternalName': Field.Name
                })
            }
            if (Field.RealFieldName != "DocIcon") {
                allFieldsInView.push({
                    'DisplayName': Field.DisplayName,
                    'Name': Field.RealFieldName,
                    'Type': Field.FieldType,
                    'InternalName': Field.Name
                })
            }
        }

        return allFieldsInView;
    }

    var getAllViewNameAndGuid = function () {
        for (element in window) {
            if (element.substring(0, 3) == 'ctx') {
                ArrayOfAllFoundVariables.push(window[element]);
            }
        }
        var webparts = [];
        ArrayOfAllFoundVariables.forEach(function (contextObject, indexOfArray) {
            if (contextObject != null) {
                var wpq = contextObject['wpq'];
                if (webparts.indexOf(wpq) === -1) {
                    webparts.push(wpq);
                    var $addNewToolbar = $('#Hero-' + wpq).find('td.ms-list-addnew');
                    if ($addNewToolbar.find('.ms-qcb-leftzone').length > 0) {
                        $addNewToolbar.find('.ms-qcb-leftzone').append('<li class="ms-qcb-item"><button type="button" id="btnExport' + indexOfArray + '" onclick="exportToView.exportView(' + indexOfArray + ')">Export</button></li>');
                    }
                    else {
                        $addNewToolbar.append('<button type="button" id="btnExport' + indexOfArray + '" onclick="exportToView.exportView(' + indexOfArray + ')">Export</button>')
                    }
                }
            }
        });
    }

    var JSONToCSVConvertor = function (JSONData, ShowLabel) {

        var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
        var CSV = '';
        if (ShowLabel) {
            var row = "";
            for (var index in arrData[0]) {
                row += index + '\t';
            }
            row = row.slice(0, -1);
            CSV += row + '\t\n';
        }
        for (var i = 0; i < arrData.length; i++) {
            var row = "";
            for (var index in arrData[i]) {
                var arrValue = arrData[i][index] == null ? "" : arrData[i][index];
                row += arrValue + '\t';
            }
            row.slice(0, row.length - 1);
            CSV += row + '\t\n';
        }
        if (CSV == '') {
            growl.error("Invalid data");
            return;
        }
        var fileName = "Result";
        if (msieversion()) {
            var IEwindow = window.open();
            IEwindow.document.write('sep=,\t\n' + CSV);
            IEwindow.document.close();
            IEwindow.document.execCommand('SaveAs', true, fileName + ".xls");
            IEwindow.close();
        } else {
            var uri = 'data:application/xls;charset=utf-8,' + escape(CSV);
            var link = document.createElement("a");
            link.href = uri;
            link.style = "visibility:hidden";
            link.download = fileName + ".xls";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        if (spDialogJSLoaded) {
            SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
        }
    }

    var msieversion = function () {
        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE ");
        if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) // If Internet Explorer, return version number 
        {
            return true;
        } else { // If another browser, 
            return false;
        }
    }
    var filterData = function (columnName, columnValue, multiValuedColumn, isDateColumn) {
        allData = allData.filter(function (data, index) {
            if (isDateColumn) {
                var dateValue = new Date(columnValue);
                return data[columnName].indexOf((dateValue.getMonth() + 1) + '/' + dateValue.getDate() + '/' + dateValue.getFullYear()) > -1;
            }
            else if (multiValuedColumn) {
                data[columnName] = data[columnName] || "";
                var mutiValued = data[columnName].split(';')
                if (typeof columnValue === "object") {
                    for (var index = 0; index < mutiValued.length; index++) {
                        var currentValue = mutiValued[index];
                        if (columnValue.indexOf(currentValue) > -1) {
                            return columnValue.indexOf(currentValue) > -1
                        }
                    }
                }
                return mutiValued.indexOf(columnValue) > -1;
            } else {
                return data[columnName] === columnValue;
            }
        })
    }

    $(document).ready(function () {
        setTimeout(function () {
            getAllViewNameAndGuid();
        }, 2000);
    })

    SP.SOD.loadMultiple(['sp.js', 'sp.ui.dialog.js'], function () {
        spDialogJSLoaded = true;
    });
    return {
        exportView: exportView
    }
})(jQuery);