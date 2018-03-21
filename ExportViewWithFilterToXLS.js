/**
 * @namespace exportToView 
 * @description Export To view will export view to XLS format with view filter and column filter
 * @scope Revealing Module Pattern
 * @requires jQuery
 * @param {Object} jQuery
 * @returns {function} exportView
 */
var exportToView = (function ($) {
    //#region Private Variables
    var items;
    var allFieldsInView = [];
    var allData = [];
    var ArrayOfAllFoundVariables = [];
    var termLabelAndGuid = {};
    var taxonomyField = [];
    var tempData = [];
    var spDialogJSLoaded = false;
    //#endregion

    //#region Private functions
    var getItemsFromEnumerator = function (itemEnum, resultArray, lastItemId) {
        while (itemEnum.moveNext()) {
            var currentItem = itemEnum.get_current();
            lastItemId = currentItem.get_id();
            var data = {};
            allFieldsInView.forEach(function (field) {
                if (field.Name !== "Edit") {
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
                        value = fieldValue != null ? fieldValue.get_lookupValue() : "";
                    }
                    else if (field.Type === "UserMulti") {
                        if (fieldValue !== null) {
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
                        value = fieldValue != null ? fieldValue.get_lookupValue() : "";
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
                        if (fieldValue != "" && fieldValue != null) {
                            var val = new Date(fieldValue);
                            value = val.toLocaleString();
                        }
                    }
                    else if (field.Type === "Note") {
                        value = $(fieldValue).text()
                    }
                    data[displayName] = value;
                }
                else {
                    data[field.DisplayName] = "";
                }
            });
            resultArray.push(data);
        }
        return lastItemId;
    }
    var loadItems = function (listObject, orderbyQuery, camlQuery, rowlimit, oldQuery, deferred) {
        var deferred = deferred || $.Deferred();
        var context = SP.ClientContext.get_current();
        var query = new SP.CamlQuery();
        query.set_viewXml("<View Scope='RecursiveAll'><Query>" + camlQuery + "</Query> <RowLimit>" + rowlimit + "</RowLimit> </View>");
        items = listObject.getItems(query);
        context.load(items);
        context.executeQueryAsync(function () {
            var itemEnum = items.getEnumerator();
            var numberOfItems = items.get_count();
            if (numberOfItems == rowlimit) {
                var lastItemId;
                lastItemId = getItemsFromEnumerator(itemEnum, allData, lastItemId);
                oldQuery = oldQuery || camlQuery;
                if (oldQuery !== "") {
                    var xmlDoc = $.parseXML(oldQuery);
                    $(xmlDoc).find('Where').html('<And>' + $(xmlDoc).find('Where').html() + '<Gt><FieldRef Name="ID"/><Value Type="Number">' + lastItemId
                        + '</Value></Gt></And>');
                    camlQuery = '<Where>' + $(xmlDoc).find('Where').html() + '</Where>';
                }
                else {
                    camlQuery = '<Where><Gt><FieldRef Name="ID"/><Value Type="Number">' + lastItemId + '</Value></Gt></Where>';
                }

                loadItems(listObject, orderbyQuery, camlQuery, rowlimit, oldQuery, deferred);
            }
            else {
                var lastItemId;
                getItemsFromEnumerator(itemEnum, allData, lastItemId);
                deferred.resolve(allData);
            }
        }, function (sender, args) {
            deferred.reject(sender, args);
        })
        return deferred.promise();
    }
    /**
     * @name exportView
     * @description Loads data from view and converts it to xls format.
     * @param {Number} indexOfArray 
     */
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
        var view = views.getById(ArrayOfAllFoundVariables[indexOfArray].view.replace(/{/g, "").replace(/}/g, ""));
        context.load(view);
        context.executeQueryAsync(function () {
            console.info('succ');
            var cmlQuery = view.get_viewQuery();
            var defaultOrderBy = cmlQuery;
            if (cmlQuery.indexOf('<Where>') > -1) {
                defaultOrderBy = cmlQuery.substr(0, cmlQuery.indexOf('<Where>'));
            }

            var defaultOrderByCol = "";
            var defaultOrderByAscending = 'true';
            if (defaultOrderBy != "") {
                var $defaultOrderBy = $.parseXML(defaultOrderBy);
                defaultOrderByCol = $($defaultOrderBy).find('OrderBy').find('FieldRef ').attr('Name');
                defaultOrderByAscending = $($defaultOrderBy).find('OrderBy').find('FieldRef ').attr('Ascending');
                if (defaultOrderByAscending === undefined) {
                    defaultOrderByAscending = 'true';
                }
                defaultOrderByAscending = defaultOrderByAscending.toLowerCase()
            }
            //Removing Order By from the query.
            cmlQuery = cmlQuery.substr(cmlQuery.indexOf('</OrderBy>') + '</OrderBy>'.length, cmlQuery.length - cmlQuery.indexOf('</OrderBy>'));
            var orderByQuery = '<OrderBy><FieldRef Name="ID" /></OrderBy>';
            loadItems(listObject, orderByQuery, cmlQuery, 1000).then(function (data) {
                console.info('All data from view', allData);
                if (defaultOrderByCol != "") {
                    var orderByField = allFieldsInView.filter(function (field, index) {
                        if (field.Name == defaultOrderByCol) {
                            return field;
                        }
                    });
                    if (orderByField.length > 0) {
                        var orderByFieldDisplayName = orderByField[0].DisplayName;
                        if (defaultOrderByAscending == 'true') {
                            allData = allData.sort(function (object1, object2) {

                                var x = object1[orderByFieldDisplayName];
                                var y = object2[orderByFieldDisplayName];

                                if (typeof x == "string") {
                                    x = ("" + x).toLowerCase();
                                }
                                if (typeof y == "string") {
                                    y = ("" + y).toLowerCase();
                                }

                                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                            })
                        }
                        else {
                            allData = allData.sort(function (object1, object2) {

                                var x = object1[orderByFieldDisplayName];
                                var y = object2[orderByFieldDisplayName];

                                if (typeof x == "string") {
                                    x = ("" + x).toLowerCase();
                                }
                                if (typeof y == "string") {
                                    y = ("" + y).toLowerCase();
                                }

                                return ((y < x) ? -1 : ((y > x) ? 1 : 0));
                            })
                        }
                    }
                }
                var filterLink = ArrayOfAllFoundVariables[indexOfArray].ListData.FilterLink;
                var filterFields = ArrayOfAllFoundVariables[indexOfArray].ListData.FilterFields;
                if (filterFields != undefined) {
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
                            var filterValue = GetUrlKeyValue('FilterData' + (indexOfFilterFields + 1), false, _spPageContextInfo.webAbsoluteUrl + filterLink);
                            filterValue = filterValue.split(',')
                            var termGuid = filterValue[filterValue.length - 1]
                            console.info("termGuid", termGuid);
                            var termValue = termLabelAndGuid[termGuid]
                            filterValue = termValue['Label'];
                            console.info("filterValue", filterValue);

                            filterData(filedDetail[0].DisplayName, filterValue, filedDetail[0].Type.indexOf('Multi') > -1, filedDetail[0].Type === "DateTime");
                        }
                        else {
                            var filterValue = decodeURIComponent(GetUrlKeyValue('FilterValue' + (indexOfFilterFields + 1), true, _spPageContextInfo.webAbsoluteUrl + filterLink));

                            /**
                             * Check check for multiple value
                             */
                            if (filterValue === "") {
                                var filterValues = decodeURIComponent(GetUrlKeyValue('FilterValues' + (indexOfFilterFields + 1), true, _spPageContextInfo.webAbsoluteUrl + filterLink));
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
                    JSONToCSVConvertor(allData, true, ArrayOfAllFoundVariables[indexOfArray].ListTitle);
                }
                else {
                    JSONToCSVConvertor(allData, true, ArrayOfAllFoundVariables[indexOfArray].ListTitle);
                }
            }, function (sender, args) {
                console.error('error', sender, args);
                if (spDialogJSLoaded) {
                    SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
                }
                alert("Error occurred while exporting to excel");
            });
        }, function (sender, args) {
            console.error('error', sender, args);
            if (spDialogJSLoaded) {
                SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
            }
            alert("Error occurred while exporting to excel");
        })
    };

    /**
     * @name getViewFields
     * @description get view fields from the array.
     * @param {Number} indexOfArray
     * @returns {Object} allFieldsInView
     */
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
    };

    /**
     * @name getAllViewNameAndGuid
     * @description get all context object from the page and adds export button to the view dynamically
     */
    var getAllViewNameAndGuid = function () {
        for (globalVariables in window) {
            if (globalVariables.substring(0, 3) == 'ctx') {
                ArrayOfAllFoundVariables.push(window[globalVariables]);
            }
        }
        var webparts = [];
        ArrayOfAllFoundVariables.forEach(function (contextObject, indexOfArray) {
            if (contextObject !== null) {
                var wpq = contextObject['wpq'];
                if (webparts.indexOf(wpq) === -1) {
                    webparts.push(wpq);
                    if ($('#Hero-' + wpq).length > 0) {
                        var $addNewToolbar = $('#Hero-' + wpq).find('td.ms-list-addnew');
                        if ($addNewToolbar.find('.ms-qcb-leftzone').length > 0) {
                            $addNewToolbar.find('.ms-qcb-leftzone').append('<li class="ms-qcb-item"><button type="button" id="btnExport' + indexOfArray + '" onclick="exportToView.exportView(' + indexOfArray + ')">Export</button></li>');
                        }
                        else {
                            $addNewToolbar.append('<button type="button" id="btnExport' + indexOfArray + '" onclick="exportToView.exportView(' + indexOfArray + ')">Export</button>');
                        }
                    }
                    else if ($('#script' + wpq).find('.ms-csrlistview-controldiv').length > 0) {
                        $('#script' + wpq).find('.ms-csrlistview-controldiv').append('<button type="button" id="btnExport' + indexOfArray + '" onclick="exportToView.exportView(' + indexOfArray + ')">Export</button>');
                    }
                    else {
                        $('#script' + wpq).prepend('<button type="button" id="btnExport' + indexOfArray + '" onclick="exportToView.exportView(' + indexOfArray + ')">Export</button>');
                    }
                }
            }
        });
    };

    /**
     * @name JSONToCSVConvertor
     * @description Converts JSON to xls format and header if showlabel is true
     * @param {Object} JSONData 
     * @param {Boolean} ShowLabel 
     */
    var JSONToCSVConvertor = function (JSONData, ShowLabel, listName) {

        var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
        var CSV = '';
        var row = "";
        if (ShowLabel) {
            row = "";
            for (var indexOfHeader in arrData[0]) {
                row += indexOfHeader + '\t';
            }
            row = row.slice(0, -1);
            CSV += row + '\t\n';
        }
        for (var i = 0; i < arrData.length; i++) {
            row = "";
            for (var indexOfData in arrData[i]) {
                var arrValue = arrData[i][indexOfData] === null ? "" : arrData[i][indexOfData];
                row += arrValue + '\t';
            }
            row.slice(0, row.length - 1);
            CSV += row + '\t\n';
        }
        if (CSV === '') {
            growl.error("Invalid data");
            return;
        }
        var fileName = listName || "Result";
        if (msieversion()) {
            var IEwindow = window.open();
            IEwindow.document.write(CSV);
            IEwindow.document.close();
            IEwindow.document.execCommand('SaveAs', true, fileName + ".xls");
            IEwindow.close();
        } else {
            var uri = "data:application/xls;charset=utf-8," + escape(CSV);
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
    };

    /**
     * @name msieversion
     * @description Check browser is IE or not
     * @returns {Boolean} true or false
     */
    var msieversion = function () {
        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE ");
        // If Internet Explorer, return version number 
        if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
            return true;
        }
        // If another browser, 
        else {
            return false;
        }
    };

    /**
     * @name filterData
     * @description Filters data based on the parameters passed to it
     * @param {String} columnName 
     * @param {Any} columnValue 
     * @param {Boolean} multiValuedColumn 
     * @param {Boolean} isDateColumn 
     */
    var filterData = function (columnName, columnValue, multiValuedColumn, isDateColumn) {
        allData = allData.filter(function (data, index) {
            if (isDateColumn) {
                var dateValue = new Date(columnValue);
                return data[columnName].indexOf((dateValue.getMonth() + 1) + "/" + dateValue.getDate() + "/" + dateValue.getFullYear()) > -1;
            }
            else if (multiValuedColumn) {
                data[columnName] = data[columnName] || "";
                var mutiValued = data[columnName].split(";");
                if (typeof columnValue === "object") {
                    for (var indexOfMutiValued = 0; indexOfMutiValued < mutiValued.length; indexOfMutiValued++) {
                        var currentValue = mutiValued[indexOfMutiValued];
                        if (columnValue.indexOf(currentValue) > -1) {
                            return columnValue.indexOf(currentValue) > -1;
                        }
                    }
                }
                return mutiValued.indexOf(columnValue) > -1;
            } else {
                if (data[columnName] === null || data[columnName] === undefined) {
                    data[columnName] = "";
                }
                if (typeof columnValue === "object") {
                    for (var indexOfcolumnValue = 0; indexOfcolumnValue < columnValue.length; indexOfcolumnValue++) {
                        var colValue = columnValue[indexOfcolumnValue];
                        if (data[columnName] === colValue) {
                            return data[columnName] === colValue;
                        }
                    }
                } else {
                    return data[columnName] === columnValue;
                }
            }
        });
    };

    //#endregion

    /**
     * Document ready function
     */
    $(document).ready(function () {
        setTimeout(function () {
            getAllViewNameAndGuid();
        }, 2000);
    });

    /**
     * Load sp.js and sp.ui.dialog.js for showing overlay on click
     */
    SP.SOD.loadMultiple(["sp.js", "sp.ui.dialog.js"], function () {
        spDialogJSLoaded = true;
    });

    return {
        /**
         * @name exportView
         * @description Loads data from view and converts it to xls format.
         * @param {Number} indexOfArray 
         */
        exportView: exportView
    };
})(jQuery);