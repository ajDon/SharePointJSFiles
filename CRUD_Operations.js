var CRUD = CRUD || {};
(function ($) {
    // Execute function is used to call any function in CRUD. 
    // For eg. if you want to call getListAllData then you will use execute like this CRUD.execute('getListAllData','listTitle')
    CRUD.execute = function (name) {
        return this[name] && this[name].apply(this, [].slice.call(arguments, 1));
    };
    // This function will be called automatically whenever SP.JS and SP.UI.DIALOG.JS are loaded.
    // It will bind SP overlay to ajax query. Whenever ajax query will execute it will display an default sp overlay.
    CRUD.sharepointReady = function () {
        console.info("SP.JS and SP.UI.DIALOG.JS are loaded...", CRUD);
        //This Method Will update __REQUESTDIGEST at regular Interval
        UpdateFormDigest(_spPageContextInfo.webAbsoluteUrl, _spFormDigestRefreshInterval);

        var showPopup = null;
        $(document).ajaxStart(function () {
            try {
                if (showPopup == null)
                    showPopup = SP.UI.ModalDialog.showWaitScreenWithNoClose(SP.Res.dialogLoading15);
            } catch (error) {
                console.error(error);
            }
        });

        $(document).ajaxStop(function () {
            setTimeout(function () {
                if (showPopup != null)
                    showPopup.close();
                showPopup = null;
            }, 1500);
        });
    }
    // This function is used to get list data from sharepoint without filter
    CRUD.getListAllData = function (listTitle) {
        var webUrl = _spPageContextInfo.webAbsoluteUrl || '..';
        return $.ajax({
            url: webUrl + "/_api/lists/getbytitle('" + listTitle + "')/items",
            type: "GET",
            headers: {
                "accept": "application/json;odata=verbose",
            }
        });
    }
    // This function is used to get list data by item id from sharepoint without filter
    CRUD.getListDataByItemId = function (listTitle, itemId) {
        var webUrl = _spPageContextInfo.webAbsoluteUrl || '..';
        return $.ajax({
            url: webUrl + "/_api/Web/Lists/GetByTitle('" + listTitle + "')/getItemById('" + itemId + "')",
            type: "GET",
            headers: {
                "accept": "application/json;odata=verbose",
            }
        });
    }
    // This function is used to get list data from sharepoint with filter
    // eg. Pass FilterData: {$select:'Title',$filter : 'ID eq 1'}
    CRUD.getListDataByFilter = function (listTitle, filterData, async) {
        if (async == undefined) {
            async = true;
        }
        var webUrl = _spPageContextInfo.webAbsoluteUrl || '..';
        return $.ajax({
            url: webUrl + "/_api/lists/getbytitle('" + listTitle + "')/items",
            data: $.param(filterData),
            type: "GET",
            async: async,
            headers: {
                "accept": "application/json;odata=verbose",
            }
        });
    }
    // This function is used to add data to Sharepoint list.
    CRUD.addNewListItem = function (listTitle, itemData) {
        if (!itemData['__metadata']) {
            var metadataType = {}
            CRUD.getListMetaData(listTitle)
                .success(function (data) {
                    metadataType = data;
                })
            var metadata = '{"type": "' + metadataType.d.ListItemEntityTypeFullName + '"}';
            itemData['__metadata'] = JSON.parse(metadata);
        }
        var webUrl = _spPageContextInfo.webAbsoluteUrl || '..';
        return $.ajax({
            url: webUrl + "/_api/lists/getbytitle('" + listTitle + "')/items",
            type: "POST",
            headers: {
                "accept": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "content-Type": "application/json;odata=verbose"
            },
            data: JSON.stringify(itemData)
        });
    }
    // This function is used to update list data in sharepoint based item id.
    CRUD.updateListItem = function (listTitle, itemId, itemData) {
        if (!itemData['__metadata']) {
            var metadataType = {}
            CRUD.getListMetaData(listTitle)
                .success(function (data) {
                    metadataType = data;
                })
            var metadata = '{"type": "' + metadataType.d.ListItemEntityTypeFullName + '"}';
            itemData['__metadata'] = JSON.parse(metadata);
        }
        var webUrl = _spPageContextInfo.webAbsoluteUrl || '..';
        return $.ajax({
            url: webUrl + "/_api/Web/Lists/GetByTitle('" + listTitle + "')/getItemById('" + itemId + "')",
            type: "POST",
            data: JSON.stringify(itemData),
            contentType: "application/json;odata=verbose",
            headers: {
                "Accept": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "X-HTTP-Method": "MERGE",
                "If-Match": "*"
            }
        });
    }
    // This function is used to delete list item from sharepoint based on item id.
    CRUD.deleteListItem = function (listTitle, itemId) {
        var webUrl = _spPageContextInfo.webAbsoluteUrl || '..';
        return $.ajax({
            url: webUrl + "/_api/Web/Lists/GetByTitle('" + listTitle + "')/getItemById('" + itemId + "')",
            type: "POST",
            contentType: "application/json;odata=verbose",
            headers: {
                "Accept": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "X-HTTP-Method": "DELETE",
                "If-Match": "*"
            }
        });
    }
    // This function is used to interally to get the metadata if not passed while adding or updating the list item.
    CRUD.getListMetaData = function (listTitle) {
        var webUrl = _spPageContextInfo.webAbsoluteUrl || '..';
        return $.ajax({
            url: webUrl + "/_api/lists/getbytitle('" + listTitle + "')?$select=ListItemEntityTypeFullName",
            async: false,
            type: "GET",
            headers: {
                "accept": "application/json;odata=verbose",
            }
        });
    }
    // This function is used internally while uploading the attachment to sharepoint list.
    CRUD.getFileBuffer = function (file) {
        var deferred = $.Deferred();
        var reader = new FileReader();
        reader.onload = function (e) {
            deferred.resolve(e.target.result);
        }
        reader.onerror = function (e) {
            deferred.reject(e.target.error);
        }
        reader.readAsArrayBuffer(file);
        return deferred.promise();
    }
    // This function is used to upload the file in sharepoint list.
    CRUD.uploadFileSP = function (listName, id, fileName, file) {
        var deferred = $.Deferred();
        CRUD.getFileBuffer(file).then(
            function (buffer) {
                var bytes = new Uint8Array(buffer);
                var content = new SP.Base64EncodedByteArray();
                var binary = '';
                for (var b = 0; b < bytes.length; b++) {
                    binary += String.fromCharCode(bytes[b]);
                }
                var scriptbase = _spPageContextInfo.webAbsoluteUrl + "/_layouts/15/";

                $.getScript(scriptbase + "SP.RequestExecutor.js", function () {
                    var createitem = new SP.RequestExecutor(_spPageContextInfo.webAbsoluteUrl);
                    createitem.executeAsync({
                        //url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/GetFolderByServerRelativeUrl('"+_spPageContextInfo.webServerRelativeUrl+"/Lists/"+listName+"/Attachments/"+id+"')/Files/Add(url='" + file.name + "',overwrite=true)",
                        url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items(" + id + ")/AttachmentFiles/add(FileName='" + file.name + "')",
                        method: "POST",
                        binaryStringRequestBody: true,
                        body: binary,
                        success: fsucc,
                        error: ferr,
                        state: "Update"
                    });

                    function fsucc(data) {
                        deferred.resolve(data);
                    }

                    function ferr(data) {
                        deferred.reject(data);
                        //alert('error\n\n' + data.statusText + "\n\n" + data.responseText);
                    }
                });
            },
            function (err) {
                deferred.reject(err);
            }
        );
        return deferred.promise();
    }
    // This function is used to get all the attachments in the sharepoint list.
    CRUD.getAttachmentsFromList = function (listTitle, id) {
        var webUrl = _spPageContextInfo.webAbsoluteUrl || '..';
        return $.ajax({
            url: webUrl + "/_api/lists/getbytitle('" + listTitle + "')/items(" + id + ")/AttachmentFiles",
            type: "GET",
            headers: {
                "accept": "application/json;odata=verbose",
            }
        });
    }
    // This function is used to delete the attachments in the sharepoint list.
    CRUD.deleteAttachmentFile = function (listTitle, itemId, fileName) {
        var webUrl = _spPageContextInfo.webAbsoluteUrl || '..';
        return $.ajax({
            url: webUrl + "/_api/lists/getByTitle('" + listTitle + "')/getItemById(" + itemId + ")/AttachmentFiles/getByFileName('" + fileName + "')",
            method: 'POST',
            contentType: 'application/json;odata=verbose',
            headers: {
                'X-RequestDigest': $('#__REQUESTDIGEST').val(),
                'X-HTTP-Method': 'DELETE',
                'Accept': 'application/json;odata=verbose'
            }
        });
    }
    // This function is used to create folder after Rootfolder in sharepoint library
    CRUD.createFolder = function (listTitle, folderUrl, successCallback, errorCallback) {
        var ctx = SP.ClientContext.get_current();
        var list = ctx.get_web().get_lists().getByTitle(listTitle);
        var createFolderInternal = function (parentFolder, folderUrl, successCallback, errorCallback) {
            var ctx = parentFolder.get_context();
            var folderNames, folderName;
            folderUrl = folderUrl.toString();
            if (folderUrl.indexOf('/') > -1) {
                folderNames = folderUrl.split('/');
                folderName = folderNames[0];
            } else {
                folderName = folderUrl;
            }
            var curFolder = parentFolder.get_folders().add(folderName);
            ctx.load(curFolder);
            ctx.executeQueryAsync(
                function () {
                    if (folderUrl.indexOf('/') > -1) {
                        var subFolderUrl = folderNames.slice(1, folderNames.length).join('/');
                        createFolderInternal(curFolder, subFolderUrl, successCallback, errorCallback);
                    }
                    successCallback(curFolder);
                },
                errorCallback);
        };
        createFolderInternal(list.get_rootFolder(), folderUrl, successCallback, errorCallback);
    }
    // This function is used to get choice field data.
    CRUD.getChoiceFieldData = function (listTitle, fieldName, async) {
        if (async == undefined) {
            async = true;
        }
        var webUrl = _spPageContextInfo.webAbsoluteUrl || '..';
        return $.ajax({
            url: webUrl + "/_api/web/lists/GetByTitle('" + listTitle + "')/Fields/GetByTitle('" + fieldName + "')",
            type: "GET",
            async: async,
            contentType: 'application/json;odata=verbose',
            headers: {
                "accept": "application/json; odata=verbose"
            }
        });
    }
    // This function is used to get Default form URL.
    CRUD.getDefaultFormUrl = function (listTitle, formType) {
        if (!(formType === 'DefaultDisplayFormUrl' || formType === 'DefaultEditFormUrl' || formType === 'DefaultNewFormUrl')) {
            console.error('FormType incorrect...', formType);
            return false;
        }
        else {
            var webUrl = _spPageContextInfo.webAbsoluteUrl || '..';
            return $.ajax({
                url: webUrl + "/_api/web/lists/GetByTitle('" + listTitle + "')/" + formType,
                type: "GET",
                contentType: 'application/json;odata=verbose',
                headers: {
                    "accept": "application/json; odata=verbose"
                }
            });
        }
    }
    // This function returns the user id.
    CRUD.getUserId = function (loginName) {
        SP.SOD.loadMultiple(['sp.js'], function () {
            var deferred = $.Deferred();
            var context = new SP.ClientContext.get_current();
            var ensureUser = context.get_web().ensureUser(loginName);
            context.load(ensureUser);
            context.executeQueryAsync(
                Function.createDelegate(this,
                    function () {
                        deferred.resolve(ensureUser);
                    }),
                Function.createDelegate(this,
                    function (sender, args) {
                        deferred.reject(sender, args);
                    }
                )
            );
            return deferred.promise();
        });
    }
    // This function is used to check current user is in the group or not
    CRUD.IsCurrentUserMemberOfGroup = function (groupName, OnCompleteCallback) {
        SP.SOD.loadMultiple(['sp.js'], function () {
            var currentContext = new SP.ClientContext.get_current();
            var currentWeb = currentContext.get_web();

            var currentUser = currentContext.get_web().get_currentUser();
            currentContext.load(currentUser);

            var allGroups = currentWeb.get_siteGroups();
            currentContext.load(allGroups);

            var group = allGroups.getByName(groupName);
            currentContext.load(group);

            var groupUsers = group.get_users();
            currentContext.load(groupUsers);

            currentContext.executeQueryAsync(OnSuccess, OnFailure);

            function OnSuccess(sender, args) {
                var userInGroup = false;
                var groupUserEnumerator = groupUsers.getEnumerator();
                while (groupUserEnumerator.moveNext()) {
                    var groupUser = groupUserEnumerator.get_current();
                    if (groupUser.get_id() == currentUser.get_id()) {
                        userInGroup = true;
                        break;
                    }
                }
                OnCompleteCallback(userInGroup);
            }

            function OnFailure(sender, args) {
                OnCompleteCallback(false);
            }
        });
    }
    // This function is used to check current user is Site Collection Admin or not
    CRUD.IsCurrentIsSiteAdmin = function (OnCompleteCallback) {
        SP.SOD.loadMultiple(['sp.js'], function () {
            var currentContext = new SP.ClientContext.get_current();
            var currentWeb = currentContext.get_web();
            var currentUser = currentContext.get_web().get_currentUser();
            currentContext.load(currentUser);
            currentContext.executeQueryAsync(OnSuccess, OnFailure);
            function OnSuccess() {
                OnCompleteCallback(currentUser.get_isSiteAdmin());
            }
            function OnFailure() {
                OnCompleteCallback(false);
            }
        })
    }
    // This function returns Time zone of the server
    CRUD.getTimeZone = function () {
        var webUrl = _spPageContextInfo.webAbsoluteUrl || '..';
        return $.ajax({
            url: webUrl + "/_api/Web/RegionalSettings/TimeZone",
            type: "GET",
            contentType: 'application/json;odata=verbose',
            headers: {
                "accept": "application/json; odata=verbose"
            }
        });
    }
    // Get User Property
    CRUD.getUserProperty = function (loginName, propertyName, async) {
        var webUrl = _spPageContextInfo.webAbsoluteUrl || '..';
        if (async == undefined) {
            async = true;
        }
        return $.ajax({
            url: webUrl + "/_api/SP.UserProfiles.PeopleManager/GetUserProfilePropertyFor(accountName=@v,propertyName='" + propertyName + "')?@v='i:0%23.f|membership|" + loginName + "'",
            type: "GET",
            async: async,
            headers: {
                "Accept": "application/json;odata=verbose"
            }
        });
    }
    // Get User Email address
    CRUD.getUserEmail = function (accountName, async) {
        var webUrl = _spPageContextInfo.webAbsoluteUrl || '..';
        if (async == undefined) {
            async = true;
        }

        return $.ajax({
            url: webUrl + "/_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)?@v='" + encodeURIComponent(accountName) + "'",
            type: "GET",
            async: async,
            headers: {
                "Accept": "application/json;odata=verbose"
            }
        });
    }
    // Get Email Address of all the users from SharePoint Group
    CRUD.getAllUsersEmailFromSPGroup = function (groupName, OnCompleteCallback) {
        SP.SOD.loadMultiple(['sp.js'], function () {
            var currentContext = new SP.ClientContext.get_current();
            var currentWeb = currentContext.get_web();
            var allGroups = currentWeb.get_siteGroups();
            currentContext.load(allGroups);

            var group = allGroups.getByName(groupName);
            currentContext.load(group);

            var groupUsers = group.get_users();
            currentContext.load(groupUsers);

            currentContext.executeQueryAsync(OnSuccess, OnFailure);

            function OnSuccess() {
                var groupUserEnumerator = groupUsers.getEnumerator();
                var allEmail = [];
                while (groupUserEnumerator.moveNext()) {
                    var groupUser = groupUserEnumerator.get_current();
                    allEmail.push(groupUser.get_email());
                }
                OnCompleteCallback(allEmail);
            }

            function OnFailure() {
                var emptyEmails = []
                OnCompleteCallback(emptyEmails);
            }

        });
    }
    // Utility function, where you can send email
    CRUD.sendEmail = function (from, to, cc, body, subject, async) {
        var webUrl = _spPageContextInfo.webAbsoluteUrl || '..';
        var urlTemplate = webUrl + "/_api/SP.Utilities.Utility.SendEmail";
        if (async == undefined) {
            async = true;
        }

        var properties;
        if (!(cc)) {
            properties = {
                '__metadata': {
                    'type': 'SP.Utilities.EmailProperties'
                },
                'From': from,
                'To': {
                    'results': to
                },
                'Body': body,
                'Subject': subject
            }
        }
        else {
            properties = {
                '__metadata': {
                    'type': 'SP.Utilities.EmailProperties'
                },
                'From': from,
                'To': {
                    'results': to
                },
                'CC': {
                    'results': cc
                },
                'Body': body,
                'Subject': subject
            }
        }
        properties = '{"properties": ' + JSON.stringify(properties) + '}'
        return $.ajax({
            contentType: 'application/json',
            url: urlTemplate,
            type: "POST",
            async: async,
            data: properties,
            headers: {
                "Accept": "application/json;odata=verbose",
                "content-type": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            }
        });
    }
    // Utility function, where you can call ajax by providing the paramter
    CRUD.callAjax = function (options) {
        if (!options["url"]) {
            console.error('url not included...', this);
            return false;
        }
        var defaults = {
            "method": "GET",
            "headers": {
                "content-type": "application/json;odata=verbose",
                "accept": "application/json;odata=verbose",
                "cache-control": "no-cache",
            }
        }
        var settings = $.extend({}, defaults, options);
        return $.ajax(settings);
    }
    // Create SharePoint Dialog
    CRUD.createSPDialog = function (dlgWidth, dlgHeight, dlgAllowMaximize, dlgShowClose, pageUri, title, needCallbackFunction, callbackFunction) {
        var options = { url: pageUri, title: title, width: dlgWidth, height: dlgHeight, allowMaxmize: dlgAllowMaximize, showClose: dlgShowClose };
        if (needCallbackFunction) {
            options.dialogReturnValueCallback = Function.createDelegate(null, callbackFunction);
        }
        SP.SOD.execute('sp.ui.dialog.js', 'SP.UI.ModalDialog.showModalDialog', options);
    }
    $(document).ready(function () {
        SP.SOD.loadMultiple(['sp.js', 'sp.ui.dialog.js'], CRUD.sharepointReady);
    });
})(jQuery);
