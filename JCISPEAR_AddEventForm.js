var JCISPEAR = JCISPEAR || {};

(function () {

    JCISPEAR.attendeesUsers = null;

    JCISPEAR.onSharepointReady = function () {

        JCISPEAR.changeTitleOfPage();
        jQuery.ajaxSetup({
            async: false
        })
        JCISPEAR.loadCategory();
        jQuery.ajaxSetup({
            async: true
        })
        jQuery.getScript('../SiteAssets/js/bootstrap-datetimepicker.js', function () {
            jQuery('#txtStartTime').datetimepicker({
                useCurrent: false
            });
            jQuery('#txtEndTime').datetimepicker();

            if (SP.ScriptUtility.isNullOrEmptyString(GetUrlKeyValue('LID'))) {
                jQuery('#txtStartTime').data("DateTimePicker")
                                        .minDate(new Date())
                                        .clear()
                var endDateTime = new Date();
                endDateTime.setMinutes(endDateTime.getMinutes() + 30);
                jQuery('#txtEndTime').data("DateTimePicker")
                                        .minDate(endDateTime)
                                        .clear()
            }
            jQuery("#txtStartTime").on("dp.change", function (e) {
                e.date._d.setMinutes(e.date._d.getMinutes() + 30)
                jQuery('#txtEndTime').data("DateTimePicker").minDate(e.date);
            });
            // jQuery("#txtEndTime").on("dp.change", function (e) {
            //     e.date._d.setMinutes(e.date._d.getMinutes() - 30)
            //     jQuery('#txtStartTime').data("DateTimePicker").maxDate(e.date);
            // });
        });
        if (jQuery('div [id^="peoplePicker"]').length > 0) {
            jQuery.getScript('../SiteAssets/js/SPPeoplePickerPlugin.js', function () {
                jQuery('div [id^="peoplePicker"]').each(function () {
                    if (jQuery(this).attr('id') === 'peoplePickerAttendees') {
                        jQuery(this).spPeoplePicker(true, '334px');
                        // jQuery(this).spPeoplePicker(true, '334px','User,SPGroup');
                    }
                });
                JCISPEAR.OnLoadCheckForm();
            });
        }
        else
            JCISPEAR.OnLoadCheckForm();
    }

    JCISPEAR.OnLoadCheckForm = function () {
        if (SP.ScriptUtility.isNullOrEmptyString(GetUrlKeyValue('LID'))) {
            console.info('New Form');
        } else {
            console.info('Edit Form');
            var itemId = GetUrlKeyValue('LID');
            JCISPEAR.setOldDataToEventForm('Calendar', itemId);

            SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
            SP.UI.ModalDialog.showWaitScreenWithNoClose(SP.Res.dialogLoading15);
            setTimeout(function () {
                JCISPEAR.isDisplayForm();
            }, 2000);
        }
    }

    JCISPEAR.isDisplayForm = function () {
        if (!SP.ScriptUtility.isNullOrEmptyString(GetUrlKeyValue('Form'))) {
            var formType = GetUrlKeyValue('Form');
            if (formType === 'Display') {
                jQuery(".panel-title").text("View Event");
                jQuery('button[type="button"]:not([id="buttonCancel"])').remove();
                jQuery('input').attr("disabled", "disabled");
                jQuery('select').attr("disabled", "disabled");
                jQuery(".sp-peoplepicker-delImage").hide();
                jQuery('textArea[id="txtDescription"]').attr("disabled", "disabled")
                    .css({
                        'color': '#B1B1B1',
                        'border-color': '#E1E1E1',
                        'background-color': '#FDFDFD',
                        'cursor': 'not-allowed'
                    })


                jQuery('div [id^="peoplePicker"]').each(function () {
                    jQuery(this).css({
                        'color': '#B1B1B1',
                        'border-color': '#E1E1E1',
                        'background-color': '#FDFDFD',
                        'cursor': 'not-allowed'
                    })
                });
            }
            else if (formType === 'Edit') {
                jQuery(".panel-title").text("Edit Event");
            }
        }
        SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);

        setTimeout(function () {
            SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
        }, 4000);
    }

    JCISPEAR.getEventListDataById = function (listTitle, itemId) {
        var itemData = {};
        JCISPEAR.getListDataByFilter(listTitle, {
            $select: 'Title,EventDate,EndDate,ParticipantsPicker/Title,Location,Description,JCISPEAREventsCategory/Title,JCISPEAREventsCategory/Id,Author/Title',
            $expand: 'ParticipantsPicker,JCISPEAREventsCategory,Author',
            $filter: 'Id eq ' + itemId
        })
            .fail(function (error) {
                console.error(error);
                JCISPEAR.errorNotify(listTitle, 'Error Occured while loading data...');
            })
            .success(function (data) {
                itemData = data.d;
            })
        return itemData;
    }

    JCISPEAR.setOldDataToEventForm = function (listTitle, itemId) {
        var oldData = JCISPEAR.getEventListDataById(listTitle, itemId)
        JCISPEAR.loadAttachments(listTitle, itemId);
        jQuery('#txtTitle').val(oldData.results[0].Title)

        if (oldData.results[0].EventDate != null) {
            var d = new Date(oldData.results[0].EventDate)
            jQuery('#txtStartTime input').val(moment(d).format('MM/DD/YYYY h:mm A'));
        }

        if (oldData.results[0].EndDate != null) {
            var d = new Date(oldData.results[0].EndDate)
            jQuery('#txtEndTime input').val(moment(d).format('MM/DD/YYYY h:mm A'));
        }

        setTimeout(function () {
            if (oldData.results[0].ParticipantsPicker['results']) {
                for (var i = oldData.results[0].ParticipantsPicker.results.length - 1; i >= 0; i--) {
                    jQuery('#peoplePickerAttendees').setUserKeys(oldData.results[0].ParticipantsPicker.results[i].Title);
                }
            }
        }, 100);

        jQuery('#selectCategory option:contains("' + oldData.results[0].JCISPEAREventsCategory.Title + '")').prop('selected', true);
        jQuery('#txtLocation').val(oldData.results[0].Location);
        jQuery('#txtDescription').val(oldData.results[0].Description);

        jQuery('#CreatedByName').text(oldData.results[0].Author.Title)

        jQuery('#CreatedByDiv').css({
            'visibility': 'visible'
        })
    }

    JCISPEAR.loadAttachments = function (listTitle, itemId) {
        JCISPEAR.getAttachmentsFromList(listTitle, itemId)
                .success(function (data) {
                    for (var i = 0; i < data.d.results.length; i++) {
                        var FileName = data.d.results[i]['FileName'],
                            ServerRelativeUrl = data.d.results[i]['ServerRelativeUrl'],
                            anchorTag = "<a href='" + ServerRelativeUrl + "' target='_blank'>" + FileName + "</a>",
                            anchorTagDelete = '<a class="deleteAttachment" onclick=\'JCISPEAR.deleteAttachmentFileFromList("' + listTitle + '",' + itemId + ',"' + FileName + '")\'><img width="18" title="Delete" height="18" src="../SiteAssets/images/Delete.png"></a>'
                        jQuery('#allAttachments').html(anchorTag);
                        jQuery('#allAttachments').append(anchorTagDelete);
                        document.getElementById("inputAttachment").disabled = true;
                    }
                    if (data.d.results.length > 0) {
                        jQuery('#allAttachments').show();
                        jQuery('#inputAttachment').hide();
                    } else {
                        jQuery('#inputAttachment').show();
                        jQuery('#allAttachments').hide();
                    }
                })
    }

    JCISPEAR.deleteAttachmentFileFromList = function (listTitle, itemId, fileName) {
        var confirmDialog = confirm('Are you sure you want to delete ' + fileName + '? \n Press Ok to delete or Press Cancel to cancel.');
        if (confirmDialog) {
            JCISPEAR.deleteAttachmentFile(listTitle, itemId, fileName)
                .success(function (data) {
                    var notificationData = new SPStatusNotificationData("", STSHtmlEncode("Attachment Deleted Successfully..."), "../SiteAssets/images/success_notify.png", null),
                        notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(listTitle), false, null, null, notificationData);
                    notification.Show(false);
                    jQuery('#allAttachments').html('');
                    jQuery('#allAttachments').hide();
                    document.getElementById("inputAttachment").disabled = false;
                    jQuery('#inputAttachment').show();
                })
                .fail(function (error) {
                    var notificationData = new SPStatusNotificationData("", STSHtmlEncode("Error occured while deleting the Attachment..."), "../SiteAssets/images/error_notify.png", null),
                        notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(listTitle), false, null, null, notificationData);
                    notification.Show(false);
                })
        }
    }


    JCISPEAR.EventNewItem = function () {
        var Title = jQuery('#txtTitle').val(),
            EventDate = jQuery('#txtStartTime input').val(),
            EndDate = jQuery('#txtEndTime input').val(),
            ParticipantsPicker = JCISPEAR.attendeesUsers,
            JCISPEAREventsCategoryId = jQuery('#selectCategory').val(),
            Location = jQuery('#txtLocation').val(),
            Description = jQuery('#txtDescription').val(),
            newData = {},
            newItemData = '{"Title" : "' + Title + '",'
        newItemData += '"EventDate" : "' + EventDate + '",'
        newItemData += '"EndDate" : "' + EndDate + '",'
        newItemData += '"ParticipantsPickerId" : ' + JSON.stringify(ParticipantsPicker) + ','
        newItemData += '"JCISPEAREventsCategoryId" : "' + JCISPEAREventsCategoryId + '",'
        newItemData += '"Location" : "' + Location + '",'
        newItemData += '"Description" : "' + Description + '"}'

        newData = JSON.parse(newItemData);

        jQuery.each(newData, function (key, value) {
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

    JCISPEAR.errorNotify = function (messageTitle, message) {
        try {
            var notificationData = new SPStatusNotificationData("", STSHtmlEncode(message), "../SiteAssets/images/error_notify.png", null),
                notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(messageTitle), false, null, null, notificationData);
            notification.Show(false);
        } catch (e) {
            console.error(e);
        }
    }

    JCISPEAR.successNotify = function (messageTitle, message) {
        try {
            var notificationData = new SPStatusNotificationData("", STSHtmlEncode(message), "../SiteAssets/images/success_notify.png", null),
                notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(messageTitle), false, null, null, notificationData);
            notification.Show(false);
        } catch (e) {
            console.error(e);
        }
    }

    JCISPEAR.loadCategory = function () {
        var filterJSON = { $select: 'Id,Title' };
        JCISPEAR.getListDataByFilter('Events-Category Master LIst', filterJSON)
            .success(function (data) {
                for (var i = 0; i < data.d.results.length; i++) {
                    var categoryValue = data.d.results[i].Title,
                        Id = data.d.results[i].Id,
                        $option = "<option value='" + Id + "'>" + categoryValue + "</option>";
                    jQuery('#selectCategory').append($option);
                }
            })
            .fail(function (error) {
                console.log(error);
                JCISPEAR.errorNotify('Category', 'Error Occured while loading Category data');
            })
    }

    JCISPEAR.AddNewItemToList = function (listTitle, newItemJSON) {
        var newItem = JCISPEAR.addNewListItem(listTitle, newItemJSON)
            .success(function (data) {
            	SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
                SP.UI.ModalDialog.showWaitScreenWithNoClose(SP.Res.dialogLoading15);
                JCISPEAR.AddAttachment(listTitle, data.d.Id, 'File');
                JCISPEAR.successNotify('Event', 'Saved Successfully...');
                setTimeout(function () {
                    JCISPEAR.redirect();
                }, 500);
            })
            .fail(function (error) {
                jQuery('#buttonOpenItems').removeAttr("disabled");
                console.error(error);
                JCISPEAR.errorNotify('Event', 'Error Occured while saving...');
            })
    }

    JCISPEAR.AddAttachment = function (listTitle, itemId, messageTitle) {
        messageTitle = messageTitle || listTitle;
        if (document.getElementById("inputAttachment").files.length === 0) {
            var notificationData = new SPStatusNotificationData("", STSHtmlEncode("Saved Successfully..."), "../SiteAssets/images/success_notify.png", null),
                notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(messageTitle), false, null, null, notificationData);
            notification.Show(false);
            JCISPEAR.redirect();
            return;
        }
        SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
        SP.UI.ModalDialog.showWaitScreenWithNoClose(SP.Res.dialogLoading15, "Time taken to upload file it depends upon the size of the file", null, 500);

        var parts = document.getElementById("inputAttachment").value.split("\\");
        var filename = parts[parts.length - 1];
        var file = document.getElementById("inputAttachment").files[0];
        JCISPEAR.uploadFileSP(listTitle, itemId, filename, file)
            .then(
                function (files) {
                    SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
                    var notificationData = new SPStatusNotificationData("", STSHtmlEncode("Uploaded Successfully..."), "../SiteAssets/images/success_notify.png", null),
                        notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(messageTitle), false, null, null, notificationData);
                    notification.Show(false);
                    JCISPEAR.redirect();
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
                        JCISPEAR.redirect();
                    }, 1500)
                
            }
            )
    }

    JCISPEAR.UpdateItemToList = function (listTitle, itemId, EventJSON) {
        var newItem = JCISPEAR.updateListItem(listTitle, itemId, EventJSON)
            .success(function (data) {
                SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.Cancel, null);
                SP.UI.ModalDialog.showWaitScreenWithNoClose(SP.Res.dialogLoading15);
                JCISPEAR.AddAttachment(listTitle, itemId, 'File');
                JCISPEAR.successNotify('Event', 'Saved Successfully...');
                setTimeout(function () {
                    JCISPEAR.redirect();
                }, 500);
            })
            .fail(function (error) {
                jQuery('#buttonOpenItems').removeAttr("disabled");
                console.error(error);
                JCISPEAR.errorNotify('Event', 'Error Occured while saving...');
            })
    }

    JCISPEAR.saveEventForEventForm = function (listTitle) {
        JCISPEAR.attendeesUsers = { "results": [] };

        if (SP.ScriptUtility.isNullOrEmptyString(jQuery('#txtTitle').val())) {
            alert('Title should not be blank.');
            jQuery('#txtTitle').focus();
            jQuery('#buttonOpenItems').removeAttr("disabled");
            return false;
        } else if (SP.ScriptUtility.isNullOrEmptyString(jQuery('#peoplePickerAttendees').getUserKeys())) {
            alert('Attendees should not be blank.');
            //jQuery('#peoplePickerAttendees').focus();
            jQuery('#peoplePickerAttendees_TopSpan').click();
            jQuery('#buttonOpenItems').removeAttr("disabled");
            return false;
        } else if (SP.ScriptUtility.isNullOrEmptyString(jQuery('#txtStartTime input').val())) {
            alert('Start Time should not be blank.');
            jQuery('#txtStartTime input').focus();
            jQuery('#buttonOpenItems').removeAttr("disabled");
            return false;
        } else if (SP.ScriptUtility.isNullOrEmptyString(jQuery('#txtEndTime input').val())) {
            alert('End Time should not be blank.');
            jQuery('#txtEndTime input').focus();
            jQuery('#buttonOpenItems').removeAttr("disabled");
            return false;
        } 
        else if (new Date(jQuery('#txtStartTime input').val()) > new Date(jQuery('#txtEndTime input').val())) {
            alert('Start Time cannot be greater than End Time.');
            jQuery('#buttonOpenItems').removeAttr("disabled");
            return false
        }
        else {
            if (SP.ScriptUtility.isNullOrEmptyString(GetUrlKeyValue('LID'))) {
                console.log('New Form');
                var allAttendeesKeys = jQuery('#peoplePickerAttendees').getUserKeys().split(';'),
                    ctr = 0,
                    totalKeys = 0;

                if (!SP.ScriptUtility.isNullOrEmptyString(jQuery('#peoplePickerAttendees').getUserKeys()))
                    totalKeys += allAttendeesKeys.length

                for (var i = 0; i <= totalKeys - 1; i++) {
                    JCISPEAR.getUserId(allAttendeesKeys[i])
                        .then(function (attendeesUser) {
                            JCISPEAR.attendeesUsers.results.push(attendeesUser.get_id());
                            ctr++;
                        })
                }

                var myVar = setInterval(
                    function () {
                        addNewItem()
                    }, 100);
                function addNewItem() {
                    if (ctr === totalKeys) {
                        JCISPEAR.AddNewItemToList(listTitle, JCISPEAR.EventNewItem());
                        clearInterval(myVar);
                    }
                }
            }
            else {
                console.log('Edit Form');
                var itemId = GetUrlKeyValue('LID'),
                    allAttendeesKeys = jQuery('#peoplePickerAttendees').getUserKeys().split(';'),
                    ctr = 0,
                    totalKeys = 0;

                if (!SP.ScriptUtility.isNullOrEmptyString(jQuery('#peoplePickerAttendees').getUserKeys()))
                    totalKeys += allAttendeesKeys.length

                for (var i = 0; i <= totalKeys - 1; i++) {
                    JCISPEAR.getUserId(allAttendeesKeys[i])
                        .then(function (attendeesUser) {
                            JCISPEAR.attendeesUsers.results.push(attendeesUser.get_id());
                            ctr++;
                        })
                }

                var myVar = setInterval(
                    function () {
                        updateNewItem()
                    }, 100);
                function updateNewItem() {
                    if (ctr === totalKeys) {
                        JCISPEAR.UpdateItemToList(listTitle, itemId, JCISPEAR.EventNewItem());
                        clearInterval(myVar);
                    }
                }
            }
        }
    }

    JCISPEAR.redirect = function () {
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

    JCISPEAR.changeTitleOfPage = function () {
        console.info('Title Change Trigger');
        var currentUrl = decodeURI(window.location.href),
            itemId = GetUrlKeyValue('LID'),
            pageTitle = '';
        if(currentUrl.toLowerCase().indexOf('Add Event.aspx')){
            if(SP.ScriptUtility.isNullOrEmptyString(itemId))
                pageTitle = 'Add Event'
            else if(GetUrlKeyValue('Form')==='Display')
                pageTitle = 'View Event'
            else
                pageTitle = 'Edit Event'

            jQuery('title').html(pageTitle);
        }
    }

    jQuery(document).ready(function () {

        SP.SOD.loadMultiple(['sp.js', 'sp.ui.dialog.js'], JCISPEAR.onSharepointReady);
        jQuery('.menu-item-text:contains("Recycle Bin")').remove();
        // Apply inline css for header layout 
        var headerIcon = jQuery("#ms-help").children().children();
        headerIcon.css("display", "inline");
        var headerIconIn = jQuery("#ms-help").children().children().children();
        headerIconIn.css("margin-top", "7px");
        var headerIconTwo = jQuery("#fullscreenmode").children().children();
        headerIconTwo.css("display", "inline");
        var headerIconTwoIn = jQuery("#fullscreenmode").children().children().children();
        headerIconTwoIn.css("margin-top", "7px");

        if (typeof (sessionStorage["SPEAR Admin"]) === "undefined" ||
            typeof (sessionStorage["SPEAR HR Scorecard Admin"]) === "undefined" ||
            typeof (sessionStorage["SPEAR HR Scorecard User"]) === "undefined" ||
            typeof (sessionStorage["SPEAR Task User"]) === "undefined" ||
            typeof (sessionStorage["SPEAR Task Admin"]) === "undefined" ||
            typeof (sessionStorage["SPEAR Event User"]) === "undefined" ||
            typeof (sessionStorage["SPEAR Event Admin"]) === "undefined") {
            JCICommon.verifyCurrentUserGroup("SPEAR Admin");
            JCICommon.verifyCurrentUserGroup("SPEAR HR Scorecard Admin");
            JCICommon.verifyCurrentUserGroup("SPEAR HR Scorecard User");
            JCICommon.verifyCurrentUserGroup("SPEAR Task User");
            JCICommon.verifyCurrentUserGroup("SPEAR Task Admin");
            JCICommon.verifyCurrentUserGroup("SPEAR Event User");
            JCICommon.verifyCurrentUserGroup("SPEAR Event Admin");
        }

        if (sessionStorage["SPEAR Admin"] != "Yes") {
            jQuery('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/Users.aspx"]').hide();
            jQuery('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/Admin.aspx"]').hide();
        }

        if (!(sessionStorage['SPEAR Admin'] === 'Yes' ||
                sessionStorage['SPEAR HR Scorecard Admin'] === 'Yes' ||
                sessionStorage['SPEAR HR Scorecard User'] === 'Yes')) {
            jQuery('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/HRScorecard.aspx"]').hide();
        }

        if (!(sessionStorage['SPEAR Admin'] === 'Yes' ||
            sessionStorage['SPEAR Task User'] === 'Yes' ||
            sessionStorage['SPEAR Task Admin'] === 'Yes')) {
            jQuery('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/TasksPage.aspx"]').hide();
        }

        if (!(sessionStorage['SPEAR Admin'] === 'Yes' ||
            sessionStorage['SPEAR Event User'] === 'Yes' ||
            sessionStorage['SPEAR Event Admin'] === 'Yes')) {
            jQuery('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/Events.aspx"]').hide();
        }

        jQuery('#buttonOpenItems').click(function (event) {
            jQuery(this).attr("disabled", "disabled");
            JCISPEAR.saveEventForEventForm('Calendar');
        })

        jQuery("#buttonCancel").click(function (event) {
            JCISPEAR.redirect();
        })
    });

    //Ashish
    //Fetch Category Data
    JCISPEAR.getListDataByFilter("Events-Category Master LIst", { $select: "Title,JCISPEAREventClass" }).success(function (data) {
        //eventCategory = data.d.results;
        jQuery(".legendUl").empty();
        jQuery(data.d.results).each(function (i, o) {
            var eventClass = "";
            if (o.JCISPEAREventClass) {
                eventClass = "event-" + o.JCISPEAREventClass.replace(/ /g, '').toLowerCase();
            }
            if (jQuery('.legendUl .' + eventClass).length == 0)
                jQuery(".legendUl").append(jQuery('<li><span class="circleLegendOne ' + eventClass + '"></span><label class="label-legend">' + o.Title + '</label></li>'));
            else {
                var legendLabel = jQuery('.legendUl .' + eventClass).next();
                legendLabel.text(legendLabel.text() + ', ' + o.Title);
            }
        })
    }).fail(function (error) {
        console.error(error);
    });
})();