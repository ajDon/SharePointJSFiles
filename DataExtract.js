var ExtractFromView = {};
(function ($) {
    $.fn.Extract = function () {
        return this.bind("click", function (event) {
            ExtractFromView.ExtractButtonEvent();
            event.preventDefault();
        });
    };
    $.fn.AddModifyViewLink = function (options) {
        var settings = $.extend({
            // Default Values.
            class: "link"
        }, options);
        return this.each(function () {
            var link = ExtractFromView.CreateModifyLink();
            $(this).append(
                $(link).addClass(settings.class)[0].outerHTML
            );
        });
    };
    ExtractFromView = {
        listName: "",
        ColumnName: "",
        Feilds: [],
        FeildValues: [],
        OnlyFeildsWithNullValues: [],
        FeildsWithNullValues: [],
        JSON_data: [],

        //Add Modify Link 
        CreateModifyLink: function () {
            var ListGuId = $(".ms-listviewtable").attr("id").split("}")[0] + "}";
            var View = decodeURIComponent($(".ms-listviewtable").attr("o:webquerysourcehref")).split("View")
            View = View[View.length - 1];
            View = View.replace(/=/g, '');
            var pageURL = _spPageContextInfo.webAbsoluteUrl + "/_layouts/15/ViewEdit.aspx?List=" + ListGuId + "&View=" + View + "&Source=" + encodeURIComponent(window.location.href);
            return "<a href='" + pageURL + "' id='ModifyView'>Modify View</a>";
        },

        ExtractButtonEvent: function () {
            listName = $(".ms-listviewtable").attr("summary");
            var JSON_Columns = [];
            var JSON_LookupAndUser = [];
            $(".ms-listviewtable").find(".ms-vh-div").each(function () {
                var newJSON = [];
                newJSON = {
                    "name": $(this).attr("name"),
                    "displayname": $(this).attr("displayname"),
                    "fieldtype": $(this).attr("fieldtype")
                };
                if ($(this).attr("fieldtype") === "Lookup" || $(this).attr("fieldtype") === "User") {
                    JSON_LookupAndUser.push($(this).attr("name"));
                }
                JSON_Columns.push(newJSON);
            });

            RESTURL = _spPageContextInfo.siteAbsoluteUrl + "/_api/lists/getbytitle('" + listName + "')/items";
            var selectColumns = "";
            var expandColumns = "";
            if (JSON_Columns.length > 0) {
                $.each(JSON_Columns, function (colIndex, colValue) {
                    selectColumns == "" ? selectColumns = "$select=" : selectColumns += ",";
                    if (colValue.fieldtype == "Lookup" || colValue.fieldtype == "User") {
                        expandColumns == "" ? expandColumns = "$expand=" : expandColumns += ",";
                        selectColumns += colValue.name + "/Title";
                        expandColumns += colValue.name + "/Title";
                    } else {
                        selectColumns += colValue.name;
                    }
                });
            }
            ExtractFromView.GetFilteredValues(JSON_LookupAndUser);
            var filterdUri = "";
            var ctr;
            var CopyOnlyFeildsWithNullValues = [];
            $.each(OnlyFeildsWithNullValues, function (i, values) {
                CopyOnlyFeildsWithNullValues.push(values.split("/")[0]);
            })
            $.each(Feilds, function (j, f1) {
                ctr = 0;
                filterWithValues = "";
                $.each(FeildValues, function (i, e1) {
                    if (e1.indexOf(f1) >= 0) {
                        ctr++;
                        i != 0 & filterWithValues != "" ? filterWithValues += " or " : null;
                        var column = e1.split("/Title")[0];
                        $.inArray(column, CopyOnlyFeildsWithNullValues) >= 0 ? null : filterWithValues += "(" + e1 + ")";
                    }
                });
                ctr > 1 & filterWithValues != "" ? filterdUri += "(" + filterWithValues + ")" : (ctr == 1 & filterWithValues != "" ? filterdUri += filterWithValues : null);
                j != Feilds.length - 1 & filterdUri != "" ? filterdUri += " and " : null;
            });
            if (selectColumns != "") {
                RESTURL += "?" + selectColumns;
                expandColumns != "" ? RESTURL += "&" + expandColumns : null;
                filterdUri != "" ? RESTURL += "&$filter=" + filterdUri : null;
            } else {
                expandColumns != "" ? RESTURL += "&" + expandColumns : null;
                filterdUri != "" ? RESTURL += "?$filter=" + filterdUri : null;
            }
            ExtractFromView.GetJSONFromREST(RESTURL, JSON_Columns);
        },

        FilterJSON: function (JSON, filterValue, filterColumn) {
            var results = [];

            if (filterColumn.indexOf("/Title") > 0) {
                filterColumn = filterColumn.split("/Title")[0];
                results = $(JSON).filter(function (index, value) {
                    return value[filterColumn]["Title"] == null;
                });
                for (var i = 0; i < filterValue.length; i++) {
                    var strValue = filterValue[i];
                    if (strValue.indexOf("'") >= 0) {
                        var firstChar = strValue.charAt(0);
                        var lastChar = strValue.charAt(strValue.length - 1);
                        if (firstChar == "'" & lastChar == "'") {
                            strValue = strValue.substring(1);
                            strValue = strValue.slice(0, -1);
                        }
                    }
                    var temp = $(JSON).filter(function (index, value) {
                        return value[filterColumn]["Title"] == strValue;
                    });
                    $.each(temp, function (index, value) {
                        results.push(value);
                    });
                }
            }
            else {
                results = $(JSON).filter(function (index, value) {
                    return value[filterColumn] == null;
                });
                for (var i = 0; i < filterValue.length; i++) {
                    var strValue = filterValue[i];
                    if (filterValue[i].indexOf("'") >= 0) {
                        var firstChar = filterValue[i].charAt(0);
                        var lastChar = filterValue[i].charAt(filterValue.length - 1);
                        if (firstChar == "'" & lastChar == "'") {
                            strValue = filterValue[i].substring(1);
                            strValue = filterValue[i].slice(0, -1);
                        }
                    }
                    var temp = $(JSON).filter(function (index, value) {
                        return value[filterColumn] == strValue;
                    });

                    $.each(temp, function (index, value) {
                        results.push(value);
                    });

                }
            }
            return results;
        },

        GetJSONFromREST: function (URL, JSON_Columns) {
            $.ajax({
                url: URL,
                type: "GET",
                headers: {
                    "accept": "application/json;odata=verbose",
                },
                async: false,
                success: function (data) {
                    JSON_data = [];
                    var results = data.d.results;
                    for (var i = 0; i < FeildsWithNullValues.length; i++) {
                        if (FeildsWithNullValues[i] != undefined) {
                            if (FeildsWithNullValues[i]["Value"].length > 0) {
                                for (var j = 0; j < FeildsWithNullValues[i]["Value"].length; j++) {
                                    var value = FeildsWithNullValues[i]["Value"];
                                    results = ExtractFromView.FilterJSON(results, value, FeildsWithNullValues[i]["ColumnName"]);
                                }
                            }
                            else {
                                results = ExtractFromView.FilterJSON(results, null, FeildsWithNullValues[i]["ColumnName"]);
                            }
                        } else {
                            results = ExtractFromView.FilterJSON(results, null, FeildsWithNullValues[i]["ColumnName"]);
                        }
                    }
                    $.each(results, function (index, item) {
                        var newItem = '{';
                        var itemValue = "";
                        var skip = false;
                        if (JSON_Columns.length > 0) {
                            $.each(JSON_Columns, function (colIndex, colValue) {
                                newItem += '"' + colValue["displayname"] + '" : ';
                                itemValue = "";
                                if (colValue["fieldtype"] === "Lookup" || colValue["fieldtype"] === "User") {
                                    itemValue = item[colValue["name"]]["Title"];
                                } else {
                                    itemValue = item[colValue["name"]];
                                }
                                itemValue != null ? newItem += '"' + itemValue + '"' : newItem += 'null';
                                colIndex != JSON_Columns.length - 1 ? newItem += ',' : null;
                            });
                            newItem += '}';

                            newItem = JSON.parse(newItem);
                            JSON_data.push(newItem);
                        }
                    })

                    ExtractFromView.JSONToCSVConvertor(JSON_data, true);
                },
                error: function (error) {
                    alert(JSON.stringify(error));
                }
            });
        },

        GetFilteredValues: function (JSON_LookupAndUser) {
            ColumnName = "";
            Feilds = [];
            FeildValues = [];
            OnlyFeildsWithNullValues = [];
            FeildsWithNullValues = [];
            var GetValues = [];
            var dec = decodeURIComponent(location.href);
            dec.substr(dec.indexOf("Filter"), dec.length)
            var filterValues = decodeURIComponent(dec.substr(dec.indexOf("Filter"), dec.length))
            $.each(filterValues.split("="), function (index, value) {
                if (value.indexOf("FilterValue") >= 0) {
                    if (value.indexOf("-") >= 0) {
                        ColumnName = value.split("-")[0];
                        $.inArray(ColumnName, JSON_LookupAndUser) >= 0 ? ColumnName += "/Title" : null;
                        Feilds.push(ColumnName);
                        GetValues[ColumnName] = [];
                    }
                } else {
                    if (value.indexOf("FilterField") >= 0) {
                        var firstValue = value.split("FilterField")[0];
                        firstValue = firstValue.substr(0, firstValue.lastIndexOf("-"));
                        if (firstValue.indexOf(";#") < 0) {
                            firstValue != "" & isNaN(firstValue) ? firstValue = "'" + firstValue + "'" : null;
                            if (firstValue === "" & OnlyFeildsWithNullValues[ColumnName] == undefined) {
                                ColumnName != "" ? OnlyFeildsWithNullValues.push(ColumnName) : null;
                            } else {
                                ColumnName != "" ? GetValues[ColumnName].push(firstValue) : null;
                                ColumnName != "" ? FeildValues.push(ColumnName + " eq " + firstValue) : null;
                            }
                        } else {
                            $.each(firstValue.split(";#"), function (firstValueIndex, SplitValues) {
                                isNaN(SplitValues) ? SplitValues = "'" + SplitValues + "'" : null;
                                if (SplitValues === "" & OnlyFeildsWithNullValues[ColumnName] == undefined) {
                                    ColumnName != "" ? OnlyFeildsWithNullValues.push(ColumnName) : null;
                                } else {
                                    ColumnName != "" ? GetValues[ColumnName].push(SplitValues) : null;
                                    ColumnName != "" ? FeildValues.push(ColumnName + " eq " + SplitValues) : null;
                                }
                            });
                        }
                    } else if (value.indexOf(";#") >= 0) {
                        $.each(value.split(";#"), function (newIndex, newValue) {
                            if (newValue.indexOf("FilterField") >= 0) {
                                var _feildValue = newValue.split("FilterField")[0];
                                _feildValue = _feildValue.substr(0, _feildValue.lastIndexOf("-"));
                                isNaN(_feildValue) ? _feildValue = "'" + _feildValue + "'" : null;
                                if (_feildValue === "" & OnlyFeildsWithNullValues[ColumnName] == undefined) {
                                    ColumnName != "" ? OnlyFeildsWithNullValues.push(ColumnName) : null;
                                } else {
                                    ColumnName != "" ? GetValues[ColumnName].push(_feildValue) : null;
                                    ColumnName != "" ? FeildValues.push(ColumnName + " eq " + _feildValue) : null;
                                }
                            } else {
                                isNaN(newValue) ? newValue = "'" + newValue + "'" : null;
                                if (newValue === "" & OnlyFeildsWithNullValues[ColumnName] == undefined) {
                                    ColumnName != "" ? OnlyFeildsWithNullValues.push(ColumnName) : null;
                                } else {
                                    ColumnName != "" ? GetValues[ColumnName].push(newValue) : null;
                                    ColumnName != "" ? FeildValues.push(ColumnName + " eq " + newValue) : null;
                                }
                            }
                        })
                    } else {
                        isNaN(value) ? value = "'" + value + "'" : null;
                        if (value === "" & OnlyFeildsWithNullValues[ColumnName] == undefined) {
                            ColumnName != "" ? OnlyFeildsWithNullValues.push(ColumnName) : null;
                        } else {
                            ColumnName != "" ? GetValues[ColumnName].push(value) : null;
                            ColumnName != "" ? FeildValues.push(ColumnName + " eq " + value) : null;
                        }
                    }
                }

                if ($.inArray(ColumnName, OnlyFeildsWithNullValues) >= 0 & ColumnName != "") {
                    var temp = '{"ColumnName" :"' + ColumnName + '","Value" : []}';
                    temp = JSON.parse(temp);
                    if (GetValues[ColumnName].length > 0) {
                        $.each(GetValues[ColumnName], function (i, ValuesFromGetValues) {
                            temp["Value"].push(ValuesFromGetValues);
                        })
                    } else {
                        temp["Value"].push(GetValues[ColumnName]);
                    }
                    FeildsWithNullValues.push(temp);
                }
            })
        },

        JSONToCSVConvertor: function (JSONData, ShowLabel) {

            var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
            var CSV = '';
            if (ShowLabel) {
                var row = "";
                for (var index in arrData[0]) {
                    row += index + ',';
                }
                row = row.slice(0, -1);
                CSV += row + '\r\n';
            }
            for (var i = 0; i < arrData.length; i++) {
                var row = "";
                for (var index in arrData[i]) {
                    var arrValue = arrData[i][index] == null ? "" : '="' + arrData[i][index] + '"';
                    row += arrValue + ',';
                }
                row.slice(0, row.length - 1);
                CSV += row + '\r\n';
            }
            if (CSV == '') {
                growl.error("Invalid data");
                return;
            }
            var fileName = "Result";
            if (ExtractFromView.msieversion()) {
                var IEwindow = window.open();
                IEwindow.document.write('sep=,\r\n' + CSV);
                IEwindow.document.close();
                IEwindow.document.execCommand('SaveAs', true, fileName + ".csv");
                IEwindow.close();
            } else {
                var uri = 'data:application/csv;charset=utf-8,' + escape(CSV);
                var link = document.createElement("a");
                link.href = uri;
                link.style = "visibility:hidden";
                link.download = fileName + ".csv";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        },
        msieversion: function () {
            var ua = window.navigator.userAgent;
            var msie = ua.indexOf("MSIE ");
            if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) // If Internet Explorer, return version number 
            {
                return true;
            } else { // If another browser, 
                return false;
            }
        }
    };
})(jQuery);