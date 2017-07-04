var AddEventForm = AddEventForm || {};

(function ($) {

    AddEventForm.attendeesUsers = null;

    AddEventForm.onSharepointReady = function () {

        AddEventForm.changeTitleOfPage();
        $.ajaxSetup({
            async: false
        })
        AddEventForm.loadCategory();
        $.ajaxSetup({
            async: true
        })
        $.getScript('../SiteAssets/js/bootstrap-datetimepicker.js', function () {
            $('#txtStartTime').datetimepicker({
                useCurrent: false
            });
            $('#txtEndTime').datetimepicker();

            if (SP.ScriptUtility.isNullOrEmptyString(GetUrlKeyValue('LID'))) {
                $('#txtStartTime').data("DateTimePicker")
                    .minDate(new Date())
                    .clear()
                var endDateTime = new Date();
                endDateTime.setMinutes(endDateTime.getMinutes() + 30);
                $('#txtEndTime').data("DateTimePicker")
                    .minDate(endDateTime)
                    .clear()
            }
            $("#txtStartTime").on("dp.change", function (e) {
                e.date._d.setMinutes(e.date._d.getMinutes() + 30)
                $('#txtEndTime').data("DateTimePicker").minDate(e.date);
            });
            // $("#txtEndTime").on("dp.change", function (e) {
            //     e.date._d.setMinutes(e.date._d.getMinutes() - 30)
            //     $('#txtStartTime').data("DateTimePicker").maxDate(e.date);
            // });
        });
        if ($('div [id^="peoplePicker"]').length > 0) {
            $.getScript('../SiteAssets/js/SPPeoplePickerPlugin.js', function () {
                $('div [id^="peoplePicker"]').each(function () {
                    if ($(this).attr('id') === 'peoplePickerAttendees') {
                        $(this).spPeoplePicker(true, '334px');
                        // $(this).spPeoplePicker(true, '334px','User,SPGroup');
                    }
                });
                AddEventForm.OnLoadCheckForm();
            });
        }
        else
            AddEventForm.OnLoadCheckForm();
    }

    AddEventForm.OnLoadCheckForm = function () {
        if (SP.ScriptUtility.isNullOrEmptyString(GetUrlKeyValue('LID'))) {
            console.info('New Form');
        } else {
            console.info('Edit Form');
            var itemId = GetUrlKeyValue('LID');
            AddEventForm.setOldDataToEventForm('Calendar', itemId);

            SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
            SP.UI.ModalDialog.showWaitScreenWithNoClose(SP.Res.dialogLoading15);
            setTimeout(function () {
                AddEventForm.isDisplayForm();
            }, 2000);
        }
    }

    AddEventForm.isDisplayForm = function () {
        if (!SP.ScriptUtility.isNullOrEmptyString(GetUrlKeyValue('Form'))) {
            var formType = GetUrlKeyValue('Form');
            if (formType === 'Display') {
                $(".panel-title").text("View Event");
                $('button[type="button"]:not([id="buttonCancel"])').remove();
                $('input').attr("disabled", "disabled");
                $('select').attr("disabled", "disabled");
                $(".sp-peoplepicker-delImage").hide();
                $('textArea[id="txtDescription"]').attr("disabled", "disabled")
                    .css({
                        'color': '#B1B1B1',
                        'border-color': '#E1E1E1',
                        'background-color': '#FDFDFD',
                        'cursor': 'not-allowed'
                    })


                $('div [id^="peoplePicker"]').each(function () {
                    $(this).css({
                        'color': '#B1B1B1',
                        'border-color': '#E1E1E1',
                        'background-color': '#FDFDFD',
                        'cursor': 'not-allowed'
                    })
                });
            }
            else if (formType === 'Edit') {
                $(".panel-title").text("Edit Event");
            }
        }
        SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);

        setTimeout(function () {
            SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
        }, 4000);
    }

    AddEventForm.getEventListDataById = function (listTitle, itemId) {
        var itemData = {};
        AddEventForm.getListDataByFilter(listTitle, {
            $select: 'Title,EventDate,EndDate,ParticipantsPicker/Title,Location,Description,AddEventFormEventsCategory/Title,AddEventFormEventsCategory/Id,Author/Title',
            $expand: 'ParticipantsPicker,AddEventFormEventsCategory,Author',
            $filter: 'Id eq ' + itemId
        })
            .fail(function (error) {
                console.error(error);
                AddEventForm.errorNotify(listTitle, 'Error Occured while loading data...');
            })
            .success(function (data) {
                itemData = data.d;
            })
        return itemData;
    }

    AddEventForm.setOldDataToEventForm = function (listTitle, itemId) {
        var oldData = AddEventForm.getEventListDataById(listTitle, itemId)
        AddEventForm.loadAttachments(listTitle, itemId);
        $('#txtTitle').val(oldData.results[0].Title)

        if (oldData.results[0].EventDate != null) {
            var d = new Date(oldData.results[0].EventDate)
            $('#txtStartTime input').val(moment(d).format('MM/DD/YYYY h:mm A'));
        }

        if (oldData.results[0].EndDate != null) {
            var d = new Date(oldData.results[0].EndDate)
            $('#txtEndTime input').val(moment(d).format('MM/DD/YYYY h:mm A'));
        }

        setTimeout(function () {
            if (oldData.results[0].ParticipantsPicker['results']) {
                for (var i = oldData.results[0].ParticipantsPicker.results.length - 1; i >= 0; i--) {
                    $('#peoplePickerAttendees').setUserKeys(oldData.results[0].ParticipantsPicker.results[i].Title);
                }
            }
        }, 100);

        $('#selectCategory option:contains("' + oldData.results[0].AddEventFormEventsCategory.Title + '")').prop('selected', true);
        $('#txtLocation').val(oldData.results[0].Location);
        $('#txtDescription').val(oldData.results[0].Description);

        $('#CreatedByName').text(oldData.results[0].Author.Title)

        $('#CreatedByDiv').css({
            'visibility': 'visible'
        })
    }

    AddEventForm.loadAttachments = function (listTitle, itemId) {
        AddEventForm.getAttachmentsFromList(listTitle, itemId)
            .success(function (data) {
                for (var i = 0; i < data.d.results.length; i++) {
                    var FileName = data.d.results[i]['FileName'],
                        ServerRelativeUrl = data.d.results[i]['ServerRelativeUrl'],
                        anchorTag = "<a href='" + ServerRelativeUrl + "' target='_blank'>" + FileName + "</a>",
                        anchorTagDelete = '<a class="deleteAttachment" onclick=\'AddEventForm.deleteAttachmentFileFromList("' + listTitle + '",' + itemId + ',"' + FileName + '")\'><img width="18" title="Delete" height="18" src="../SiteAssets/images/Delete.png"></a>'
                    $('#allAttachments').html(anchorTag);
                    $('#allAttachments').append(anchorTagDelete);
                    document.getElementById("inputAttachment").disabled = true;
                }
                if (data.d.results.length > 0) {
                    $('#allAttachments').show();
                    $('#inputAttachment').hide();
                } else {
                    $('#inputAttachment').show();
                    $('#allAttachments').hide();
                }
            })
    }

    AddEventForm.deleteAttachmentFileFromList = function (listTitle, itemId, fileName) {
        var confirmDialog = confirm('Are you sure you want to delete ' + fileName + '? \n Press Ok to delete or Press Cancel to cancel.');
        if (confirmDialog) {
            AddEventForm.deleteAttachmentFile(listTitle, itemId, fileName)
                .success(function (data) {
                    var notificationData = new SPStatusNotificationData("", STSHtmlEncode("Attachment Deleted Successfully..."), "../SiteAssets/images/success_notify.png", null),
                        notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(listTitle), false, null, null, notificationData);
                    notification.Show(false);
                    $('#allAttachments').html('');
                    $('#allAttachments').hide();
                    document.getElementById("inputAttachment").disabled = false;
                    $('#inputAttachment').show();
                })
                .fail(function (error) {
                    var notificationData = new SPStatusNotificationData("", STSHtmlEncode("Error occured while deleting the Attachment..."), "../SiteAssets/images/error_notify.png", null),
                        notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(listTitle), false, null, null, notificationData);
                    notification.Show(false);
                })
        }
    }


    AddEventForm.EventNewItem = function () {
        var Title = $('#txtTitle').val(),
            EventDate = $('#txtStartTime input').val(),
            EndDate = $('#txtEndTime input').val(),
            ParticipantsPicker = AddEventForm.attendeesUsers,
            AddEventFormEventsCategoryId = $('#selectCategory').val(),
            Location = $('#txtLocation').val(),
            Description = $('#txtDescription').val(),
            newData = {},
            newItemData = '{"Title" : "' + Title + '",'
        newItemData += '"EventDate" : "' + EventDate + '",'
        newItemData += '"EndDate" : "' + EndDate + '",'
        newItemData += '"ParticipantsPickerId" : ' + JSON.stringify(ParticipantsPicker) + ','
        newItemData += '"AddEventFormEventsCategoryId" : "' + AddEventFormEventsCategoryId + '",'
        newItemData += '"Location" : "' + Location + '",'
        newItemData += '"Description" : "' + Description + '"}'

        newData = JSON.parse(newItemData);

        $.each(newData, function (key, value) {
            if (value === "" || value === 'null') {
                newData[key] = null;
            }
            if ((key === 'EventDate' || key === 'EndDate') && !(SP.ScriptUtility.isNullOrEmptyString(value))) {
                var d = new Date(value)
                value = d.toISOString();
                newData[key] = value;
                console.info(value);
            }
        });
        console.info(newData);
        return newData;
    }

    AddEventForm.errorNotify = function (messageTitle, message) {
        try {
            var notificationData = new SPStatusNotificationData("", STSHtmlEncode(message), "../SiteAssets/images/error_notify.png", null),
                notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(messageTitle), false, null, null, notificationData);
            notification.Show(false);
        } catch (e) {
            console.error(e);
        }
    }

    AddEventForm.successNotify = function (messageTitle, message) {
        try {
            var notificationData = new SPStatusNotificationData("", STSHtmlEncode(message), "../SiteAssets/images/success_notify.png", null),
                notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(messageTitle), false, null, null, notificationData);
            notification.Show(false);
        } catch (e) {
            console.error(e);
        }
    }

    AddEventForm.loadCategory = function () {
        var filterJSON = { $select: 'Id,Title' };
        AddEventForm.getListDataByFilter('Events-Category Master LIst', filterJSON)
            .success(function (data) {
                for (var i = 0; i < data.d.results.length; i++) {
                    var categoryValue = data.d.results[i].Title,
                        Id = data.d.results[i].Id,
                        $option = "<option value='" + Id + "'>" + categoryValue + "</option>";
                    $('#selectCategory').append($option);
                }
            })
            .fail(function (error) {
                console.log(error);
                AddEventForm.errorNotify('Category', 'Error Occured while loading Category data');
            })
    }

    AddEventForm.AddNewItemToList = function (listTitle, newItemJSON) {
        var newItem = AddEventForm.addNewListItem(listTitle, newItemJSON)
            .success(function (data) {
                SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
                SP.UI.ModalDialog.showWaitScreenWithNoClose(SP.Res.dialogLoading15);
                AddEventForm.AddAttachment(listTitle, data.d.Id, 'File');
                AddEventForm.successNotify('Event', 'Saved Successfully...');
                setTimeout(function () {
                    AddEventForm.redirect();
                }, 500);
            })
            .fail(function (error) {
                $('#buttonOpenItems').removeAttr("disabled");
                console.error(error);
                AddEventForm.errorNotify('Event', 'Error Occured while saving...');
            })
    }

    AddEventForm.AddAttachment = function (listTitle, itemId, messageTitle) {
        messageTitle = messageTitle || listTitle;
        if (document.getElementById("inputAttachment").files.length === 0) {
            var notificationData = new SPStatusNotificationData("", STSHtmlEncode("Saved Successfully..."), "../SiteAssets/images/success_notify.png", null),
                notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(messageTitle), false, null, null, notificationData);
            notification.Show(false);
            AddEventForm.redirect();
            return;
        }
        SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
        SP.UI.ModalDialog.showWaitScreenWithNoClose(SP.Res.dialogLoading15, "Time taken to upload file it depends upon the size of the file", null, 500);

        var parts = document.getElementById("inputAttachment").value.split("\\");
        var filename = parts[parts.length - 1];
        var file = document.getElementById("inputAttachment").files[0];
        AddEventForm.uploadFileSP(listTitle, itemId, filename, file)
            .then(
            function (files) {
                SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
                var notificationData = new SPStatusNotificationData("", STSHtmlEncode("Uploaded Successfully..."), "../SiteAssets/images/success_notify.png", null),
                    notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(messageTitle), false, null, null, notificationData);
                notification.Show(false);
                AddEventForm.redirect();
            },
            function (error) {

                SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
                //alert('error\n\n' + JSON.stringify(error));
                var notificationData = new SPStatusNotificationData("", STSHtmlEncode("List Item Saved Successfully..."), "../SiteAssets/images/success_notify.png", null),
                    notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(messageTitle), false, null, null, notificationData),

                    errorNotificationData = new SPStatusNotificationData("", STSHtmlEncode("Error occured while uploading the file..."), "../SiteAssets/images/error_notify.png", null),
                    errorNotification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(messageTitle), false, null, null, errorNotificationData);

                notification.Show(false);
                errorNotification.Show(false);
                setTimeout(function () {
                    AddEventForm.redirect();
                }, 1500)

            }
            )
    }

    AddEventForm.UpdateItemToList = function (listTitle, itemId, EventJSON) {
        var newItem = AddEventForm.updateListItem(listTitle, itemId, EventJSON)
            .success(function (data) {
                SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
                SP.UI.ModalDialog.showWaitScreenWithNoClose(SP.Res.dialogLoading15);
                AddEventForm.AddAttachment(listTitle, itemId, 'File');
                AddEventForm.successNotify('Event', 'Saved Successfully...');
                setTimeout(function () {
                    AddEventForm.redirect();
                }, 500);
            })
            .fail(function (error) {
                $('#buttonOpenItems').removeAttr("disabled");
                console.error(error);
                AddEventForm.errorNotify('Event', 'Error Occured while saving...');
            })
    }

    AddEventForm.saveEventForEventForm = function (listTitle) {
        AddEventForm.attendeesUsers = { "results": [] };

        if (SP.ScriptUtility.isNullOrEmptyString($('#txtTitle').val())) {
            alert('Title should not be blank.');
            $('#txtTitle').focus();
            $('#buttonOpenItems').removeAttr("disabled");
            return false;
        } else if (SP.ScriptUtility.isNullOrEmptyString($('#peoplePickerAttendees').getUserKeys())) {
            alert('Attendees should not be blank.');
            //$('#peoplePickerAttendees').focus();
            $('#peoplePickerAttendees_TopSpan').click();
            $('#buttonOpenItems').removeAttr("disabled");
            return false;
        } else if (SP.ScriptUtility.isNullOrEmptyString($('#txtStartTime input').val())) {
            alert('Start Time should not be blank.');
            $('#txtStartTime input').focus();
            $('#buttonOpenItems').removeAttr("disabled");
            return false;
        } else if (SP.ScriptUtility.isNullOrEmptyString($('#txtEndTime input').val())) {
            alert('End Time should not be blank.');
            $('#txtEndTime input').focus();
            $('#buttonOpenItems').removeAttr("disabled");
            return false;
        }
        else if (new Date($('#txtStartTime input').val()) > new Date($('#txtEndTime input').val())) {
            alert('Start Time cannot be greater than End Time.');
            $('#buttonOpenItems').removeAttr("disabled");
            return false
        }
        else {
            if (SP.ScriptUtility.isNullOrEmptyString(GetUrlKeyValue('LID'))) {
                console.log('New Form');
                var allAttendeesKeys = $('#peoplePickerAttendees').getUserKeys().split(';'),
                    ctr = 0,
                    totalKeys = 0;

                if (!SP.ScriptUtility.isNullOrEmptyString($('#peoplePickerAttendees').getUserKeys()))
                    totalKeys += allAttendeesKeys.length

                for (var i = 0; i <= totalKeys - 1; i++) {
                    AddEventForm.getUserId(allAttendeesKeys[i])
                        .then(function (attendeesUser) {
                            AddEventForm.attendeesUsers.results.push(attendeesUser.get_id());
                            ctr++;
                        })
                }

                var myVar = setInterval(
                    function () {
                        addNewItem()
                    }, 100);
                function addNewItem() {
                    if (ctr === totalKeys) {
                        AddEventForm.AddNewItemToList(listTitle, AddEventForm.EventNewItem());
                        clearInterval(myVar);
                    }
                }
            }
            else {
                console.log('Edit Form');
                var itemId = GetUrlKeyValue('LID'),
                    allAttendeesKeys = $('#peoplePickerAttendees').getUserKeys().split(';'),
                    ctr = 0,
                    totalKeys = 0;

                if (!SP.ScriptUtility.isNullOrEmptyString($('#peoplePickerAttendees').getUserKeys()))
                    totalKeys += allAttendeesKeys.length

                for (var i = 0; i <= totalKeys - 1; i++) {
                    AddEventForm.getUserId(allAttendeesKeys[i])
                        .then(function (attendeesUser) {
                            AddEventForm.attendeesUsers.results.push(attendeesUser.get_id());
                            ctr++;
                        })
                }

                var myVar = setInterval(
                    function () {
                        updateNewItem()
                    }, 100);
                function updateNewItem() {
                    if (ctr === totalKeys) {
                        AddEventForm.UpdateItemToList(listTitle, itemId, AddEventForm.EventNewItem());
                        clearInterval(myVar);
                    }
                }
            }
        }
    }

    AddEventForm.redirect = function () {
        console.info('Redirect')
        var currentUrl = decodeURI(window.location.href),
            sourceUrl = GetUrlKeyValue('Source'),
            hostUrl = _spPageContextInfo.webAbsoluteUrl

        if (SP.ScriptUtility.isNullOrEmptyString(sourceUrl)) {
            if (currentUrl.toLowerCase().indexOf('add event.aspx') != -1)
                SP.Utilities.HttpUtility.navigateTo(hostUrl + '/SitePages/Events.aspx');
        }
        else
            SP.Utilities.HttpUtility.navigateTo(decodeURI(sourceUrl));
    }

    AddEventForm.changeTitleOfPage = function () {
        console.info('Title Change Trigger');
        var currentUrl = decodeURI(window.location.href),
            itemId = GetUrlKeyValue('LID'),
            pageTitle = '';
        if (currentUrl.toLowerCase().indexOf('Add Event.aspx')) {
            if (SP.ScriptUtility.isNullOrEmptyString(itemId))
                pageTitle = 'Add Event'
            else if (GetUrlKeyValue('Form') === 'Display')
                pageTitle = 'View Event'
            else
                pageTitle = 'Edit Event'

            $('title').html(pageTitle);
        }
    }

    $(document).ready(function () {

        SP.SOD.loadMultiple(['sp.js', 'sp.ui.dialog.js'], AddEventForm.onSharepointReady);
        $('.menu-item-text:contains("Recycle Bin")').remove();
        // Apply inline css for header layout 
        var headerIcon = $("#ms-help").children().children();
        headerIcon.css("display", "inline");
        var headerIconIn = $("#ms-help").children().children().children();
        headerIconIn.css("margin-top", "7px");
        var headerIconTwo = $("#fullscreenmode").children().children();
        headerIconTwo.css("display", "inline");
        var headerIconTwoIn = $("#fullscreenmode").children().children().children();
        headerIconTwoIn.css("margin-top", "7px");

        // if (typeof (sessionStorage["SPEAR Admin"]) === "undefined" ||
        //     typeof (sessionStorage["SPEAR HR Scorecard Admin"]) === "undefined" ||
        //     typeof (sessionStorage["SPEAR HR Scorecard User"]) === "undefined" ||
        //     typeof (sessionStorage["SPEAR Task User"]) === "undefined" ||
        //     typeof (sessionStorage["SPEAR Task Admin"]) === "undefined" ||
        //     typeof (sessionStorage["SPEAR Event User"]) === "undefined" ||
        //     typeof (sessionStorage["SPEAR Event Admin"]) === "undefined") {
        //     JCICommon.verifyCurrentUserGroup("SPEAR Admin");
        //     JCICommon.verifyCurrentUserGroup("SPEAR HR Scorecard Admin");
        //     JCICommon.verifyCurrentUserGroup("SPEAR HR Scorecard User");
        //     JCICommon.verifyCurrentUserGroup("SPEAR Task User");
        //     JCICommon.verifyCurrentUserGroup("SPEAR Task Admin");
        //     JCICommon.verifyCurrentUserGroup("SPEAR Event User");
        //     JCICommon.verifyCurrentUserGroup("SPEAR Event Admin");
        // }

        if (sessionStorage["SPEAR Admin"] != "Yes") {
            $('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/Users.aspx"]').hide();
            $('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/Admin.aspx"]').hide();
        }

        if (!(sessionStorage['SPEAR Admin'] === 'Yes' ||
            sessionStorage['SPEAR HR Scorecard Admin'] === 'Yes' ||
            sessionStorage['SPEAR HR Scorecard User'] === 'Yes')) {
            $('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/HRScorecard.aspx"]').hide();
        }

        if (!(sessionStorage['SPEAR Admin'] === 'Yes' ||
            sessionStorage['SPEAR Task User'] === 'Yes' ||
            sessionStorage['SPEAR Task Admin'] === 'Yes')) {
            $('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/TasksPage.aspx"]').hide();
        }

        if (!(sessionStorage['SPEAR Admin'] === 'Yes' ||
            sessionStorage['SPEAR Event User'] === 'Yes' ||
            sessionStorage['SPEAR Event Admin'] === 'Yes')) {
            $('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/Events.aspx"]').hide();
        }

        $('#buttonOpenItems').click(function (event) {
            $(this).attr("disabled", "disabled");
            AddEventForm.saveEventForEventForm('Calendar');
        })

        $("#buttonCancel").click(function (event) {
            AddEventForm.redirect();
        })
    });

    //Ashish
    //Fetch Category Data
    AddEventForm.getListDataByFilter("Events-Category Master LIst", { $select: "Title,AddEventFormEventClass" }).success(function (data) {
        //eventCategory = data.d.results;
        $(".legendUl").empty();
        $(data.d.results).each(function (i, o) {
            var eventClass = "";
            if (o.AddEventFormEventClass) {
                eventClass = "event-" + o.AddEventFormEventClass.replace(/ /g, '').toLowerCase();
            }
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
})(jQuery);