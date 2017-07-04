var fullCalendar = fullCalendar || {};

(function ($) {
    "use strict";
    fullCalendar.onSharepointReady = function () {
        var showPopup = null;
        if (showPopup == null)
            showPopup = SP.UI.ModalDialog.showWaitScreenWithNoClose('Working on it...');

        fullCalendar.loadCalendar($);

        setTimeout(function () {
            if (showPopup != null)
                showPopup.close();
            showPopup = null;
        }, 1500);
    };

    fullCalendar.loadCalendar = function ($) {
        var jsonData = fullCalendar.loadDataFromList('Calendar');
        console.info(jsonData);
        var options = {
            events_source: function () {
                return jsonData;
            },
            view: 'month',
            tmpl_path: '/sites/PSSPEARDEV/SiteAssets/js/tmpls/',
            tmpl_cache: false,
            day: new Date().format('yyyy-MM-dd'),
            onAfterEventsLoad: function (events) {
                if (!events) {
                    return;
                }
                var list = $('#eventlist');
                list.html('');

                $.each(events, function (key, val) {
                    $(document.createElement('li'))
                        .html('<a href="' + val.url + '">' + val.title + '</a>')
                        .appendTo(list);
                });
            },
            onAfterViewLoad: function (view) {
                $('.page-header h3').text(this.getTitle());
                $('.btn-group button').removeClass('active');
                $('button[data-calendar-view="' + view + '"]').addClass('active');
            },
            classes: {
                months: {
                    general: 'label'
                }
            }
        };
        var calendar;
        $.getScript('../SiteAssets/js/calendar.js', function () {
            calendar = $('#calendar').calendar(options);

            $('.btn-group button[data-calendar-nav]').each(function () {
                var $this = $(this);

                $this.click(function (evt) {
                    evt.preventDefault();
                    calendar.navigate($this.data('calendar-nav'));
                });
            });

            $('.btn-group button[data-calendar-view]').each(function () {
                var $this = $(this);
                $this.click(function (evt) {
                    evt.preventDefault();
                    calendar.view($this.data('calendar-view'));

                });
            });

            $('#first_day').change(function () {
                var value = $(this).val();
                value = value.length ? parseInt(value) : null;
                calendar.setOptions({
                    first_day: value
                });
                calendar.view();
            });

            $('#language').change(function () {
                calendar.setLanguage($(this).val());
                calendar.view();
            });

            $('#events-in-modal').change(function () {
                var val = $(this).is(':checked') ? $(this).val() : null;
                calendar.setOptions({
                    modal: val
                });
            });
            $('#format-12-hours').change(function () {
                var val = $(this).is(':checked') ? true : false;
                calendar.setOptions({
                    format12: val
                });
                calendar.view();
            });
            $('#show_wbn').change(function () {
                var val = $(this).is(':checked') ? true : false;
                calendar.setOptions({
                    display_week_numbers: val
                });
                calendar.view();
            });
            $('#show_wb').change(function () {
                var val = $(this).is(':checked') ? true : false;
                calendar.setOptions({
                    weekbox: val
                });
                calendar.view();
            });
            $('#events-modal .modal-header, #events-modal .modal-footer').click(function (e) {
                //e.preventDefault();
                //e.stopPropagation();
            });
        });
    };



    fullCalendar.createJSONForCalendar = function (jsonData) {
        //Ashish
        //Fetch Category Data
        var eventClasses = {};
        fullCalendar.getListDataByFilter("Events-Category Master LIst", { $select: "Title,fullCalendarEventClass" }).success(function (data) {
            //eventCategory = data.d.results;
            $(".legendUl").empty();

            $(data.d.results).each(function (i, o) {
                var eventClass = "";
                if (o.fullCalendarEventClass) {
                    eventClass = "event-" + o.fullCalendarEventClass.replace(/ /g, '').toLowerCase();
                }
                eventClasses[o.Title] = eventClass;
                if ($('.legendUl .' + eventClass).length == 0)
                    $(".legendUl").append($('<li><span class="circleLegendOne ' + eventClass + '"></span><label class="label-legend">' + o.Title + '</label></li>'));
                else {
                    var legendLabel = $('.legendUl .' + eventClass).next();
                    legendLabel.text(legendLabel.text() + ', ' + o.Title);
                }
            })
        }).fail(function (error) {
            console.error(error);
        });

        var sourceJSON = [],
            displayMode = 'Display',
            sourceUrl = encodeURIComponent(window.location.href);
        if (typeof (sessionStorage["Admin"]) === "undefined" || typeof (sessionStorage["Event Admin"]) === "undefined") {
            JCICommon.verifyCurrentUserGroup("Admin");
            JCICommon.verifyCurrentUserGroup("Event Admin");
        }
        if (sessionStorage["Admin"] === "Yes" || sessionStorage["Event Admin"] === "Yes") {
            displayMode = 'Edit';
        }
        for (var i = 0; i < jsonData.length; i++) {
            var Id = parseInt(jsonData[i]['Id']),
                Title = jsonData[i]['Title'],
                startDate = jsonData[i]['EventDate'],
                endDate = jsonData[i]['EndDate'],
                category = jsonData[i]['fullCalendarEventsCategory']['Title'],
                _startDate = new Date(startDate),
                _endDate = new Date(endDate),
                eventClass = eventClasses[category],
                newJSON = [],
                linkUrl = "../SitePages/Add%20Event.aspx?LID=" + Id + "&Form=" + displayMode + "&Source=" + sourceUrl;

            //if (category === 'Meeting' || category === 'Work hours' || category === 'Business')
            //    eventClass = 'event-important'
            //else if (category === 'Get-together' || category === 'Gifts' || category === 'Birthday' || category === 'Anniversary')
            //    eventClass = 'event-special'
            //else if (category === 'Holiday')
            //    eventClass = 'event-success'
            newJSON = { 'id': Id, 'title': Title, 'url': linkUrl, 'class': eventClass, 'start': _startDate.getTime(), 'end': _endDate.getTime() }

            sourceJSON.push(newJSON);
        }
        return sourceJSON;
    }

    fullCalendar.loadDataFromList = function (listTitle) {

        var Category = GetUrlKeyValue('c');
        var StartDate = GetUrlKeyValue('d');
        var FilterField1 = GetUrlKeyValue('FilterField1');
        var FilterField2 = GetUrlKeyValue('FilterField2');

        if (FilterField1) {
            if (FilterField1 == "fullCalendarEventsCategory")
                Category = GetUrlKeyValue('FilterValue1');
            if (FilterField1 == "EventDate")
                StartDate = GetUrlKeyValue('FilterValue1');
        }
        if (FilterField2) {
            if (FilterField2 == "fullCalendarEventsCategory")
                Category = GetUrlKeyValue('FilterValue2');
            if (FilterField2 == "EventDate")
                StartDate = GetUrlKeyValue('FilterValue2');
        }
        //console.log(Category + "\n" + StartDate);
        var jsonData,
            filterJSON = {
                $select: 'Id,Title,fullCalendarEventsCategory/Title,fullCalendarEventsCategory/Id,EventDate,EndDate,ParticipantsPicker/Id,ParticipantsPicker/Title,Author/Id,Author/Title',
                $expand: 'ParticipantsPicker,Author,fullCalendarEventsCategory'
            },
            filter = '( (ParticipantsPicker/Id eq ' + _spPageContextInfo.userId + ' or Author/Id eq ' + _spPageContextInfo.userId + ')';

        if (!SP.ScriptUtility.isNullOrEmptyString(Category)) {
            filter += "and fullCalendarEventsCategory/Title eq '" + Category + "'"
        }

        if (!SP.ScriptUtility.isNullOrEmptyString(filter)) {
            filter += " )"
            filterJSON['$filter'] = filter
        }


        fullCalendar.getListDataByFilter(listTitle, filterJSON)
            .success(function (data) {
                console.info(data);
                jsonData = data.d.results
                if (!SP.ScriptUtility.isNullOrEmptyString(StartDate)) {
                    jsonData = fullCalendar.filterJSONByDate(jsonData, StartDate)
                }
            })
            .fail(function (error) {
                console.error(error);
                fullCalendar.errorNotify(listTitle, 'Error Occurred while fetching the data from ' + listTitle);
            })

        return fullCalendar.createJSONForCalendar(jsonData);
    }

    fullCalendar.filterJSONByDate = function (jsonData, filteredDate) {
        var _filteredDate = new Date(filteredDate),
            newJSONData = $(jsonData).filter(function (index, value) {
                return (new Date(value['EventDate']) >= _filteredDate)
            })
        return newJSONData;
    }

    fullCalendar.errorNotify = function (messageTitle, message) {
        try {
            var notificationData = new SPStatusNotificationData("", STSHtmlEncode(message), "../SiteAssets/images/error_notify.png", null),
                notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(messageTitle), false, null, null, notificationData);
            notification.Show(false);
        } catch (e) {
            console.error(e);
        }
    }

    fullCalendar.successNotify = function (messageTitle, message) {
        try {
            var notificationData = new SPStatusNotificationData("", STSHtmlEncode(message), "../SiteAssets/images/success_notify.png", null),
                notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(messageTitle), false, null, null, notificationData);
            notification.Show(false);
        } catch (e) {
            console.error(e);
        }
    }

    $(document).ready(function () {
        SP.SOD.loadMultiple(['sp.js', 'sp.ui.dialog.js'], fullCalendar.onSharepointReady);

        // if (typeof (sessionStorage["Admin"]) === "undefined" ||
        //     typeof (sessionStorage["HR Scorecard Admin"]) === "undefined" ||
        //     typeof (sessionStorage["HR Scorecard User"]) === "undefined" ||
        //     typeof (sessionStorage["Document User"]) === "undefined" ||
        //     typeof (sessionStorage["Document Admin"]) === "undefined" ||
        //     typeof (sessionStorage["Task User"]) === "undefined" ||
        //     typeof (sessionStorage["Task Admin"]) === "undefined" ||
        //     typeof (sessionStorage["Event User"]) === "undefined" ||
        //     typeof (sessionStorage["Event Admin"]) === "undefined") {
        //     JCICommon.verifyCurrentUserGroup("Admin");
        //     JCICommon.verifyCurrentUserGroup("HR Scorecard Admin");
        //     JCICommon.verifyCurrentUserGroup("HR Scorecard User");
        //     JCICommon.verifyCurrentUserGroup("Document User");
        //     JCICommon.verifyCurrentUserGroup("Document Admin");
        //     JCICommon.verifyCurrentUserGroup("Task User");
        //     JCICommon.verifyCurrentUserGroup("Task Admin");
        //     JCICommon.verifyCurrentUserGroup("Event User");
        //     JCICommon.verifyCurrentUserGroup("Event Admin");
        // }

        if (sessionStorage["Admin"] != "Yes") {
            $('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/Users.aspx"]').hide();
            $('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/Admin.aspx"]').hide();
        }

        if (!(sessionStorage['Admin'] === 'Yes' ||
            sessionStorage['HR Scorecard Admin'] === 'Yes' ||
            sessionStorage['HR Scorecard User'] === 'Yes')) {
            $('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/HRScorecard.aspx"]').hide();
        }

        if (!(sessionStorage['Admin'] === 'Yes' ||
            sessionStorage['Task User'] === 'Yes' ||
            sessionStorage['Task Admin'] === 'Yes')) {
            $('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/TasksPage.aspx"]').hide();
        }

        if (!(sessionStorage['Admin'] === 'Yes' ||
            sessionStorage['Event User'] === 'Yes' ||
            sessionStorage['Event Admin'] === 'Yes')) {
            $('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/Events.aspx"]').hide();
        }
        if (!(sessionStorage['Admin'] === 'Yes' ||
            sessionStorage['Document User'] === 'Yes' ||
            sessionStorage['Document Admin'] === 'Yes')) {
            $('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/Document Category.aspx"]').hide();
        }
        $('.menu-item-text:contains("Recycle Bin")').remove();

    })
})(jQuery);