(function ($) {
    RegisterScriptFiles('clienttemplates.js');
    RegisterScriptFiles('clientforms.js');
    RegisterScriptFiles('clientpeoplepicker.js');
    RegisterScriptFiles('autofill.js');

    AddStyleForPeoplePicker();

    // Load JS Files From _layout Folder
    function RegisterScriptFiles(filename) {
        if (RegisterSod != undefined) {
            RegisterSod(filename, '/_layouts/15/' + filename);
            SP.SOD.loadMultiple([filename], function () {
                console.info('File Loaded', filename);
            })
        }
        else {
            var scriptEle = document.createElement('script');
            scriptEle.setAttribute("type", "text/javascript")
            scriptEle.setAttribute("src", "/_layouts/15/" + filename);
            document.getElementsByTagName("head")[0].appendChild(scriptEle)
        }
    }
    // Add Style for People picker
    function AddStyleForPeoplePicker() {
        var style = '<style type="text/css">' +
            '.disablePeoplePicker {' +
            'color: rgb(177, 177, 177);' +
            'border-color: rgb(225, 225, 225);' +
            'background-color: rgb(253, 253, 253);' +
            'cursor: not-allowed;' +
            '}' +
            '.disablePeoplePicker > span >.sp-peoplepicker-delImage {' +
            'display: none;' +
            '}' +
            '</style>';
        $('head').append(style);
    }
    // Render and initialize the client-side People Picker.
    function initializePeoplePicker(eleId, AllowMultipleValues, Width, accountType) {
        // Create a schema to store picker properties, and set the properties.
        var schema = {};
        if (accountType === undefined) {
            accountType = "User";
        } else if (typeof (accountType) === "object") {
            accountType = accountType.toString()
        }
        else if (typeof (accountType) != "string") {
            accountType = "User";
        }

        if (Width === undefined) {
            Width = "250px";
        }

        // schema['PrincipalAccountType'] = 'User,DL,SecGroup,SPGroup';
        schema['PrincipalAccountType'] = accountType;
        schema['SearchPrincipalSource'] = 15;
        schema['ResolvePrincipalSource'] = 15;
        schema['AllowMultipleValues'] = AllowMultipleValues;
        schema['MaximumEntitySuggestions'] = 50;
        schema['Width'] = Width;
        // Render and initialize the picker. 
        // Pass the ID of the DOM element that contains the picker, an array of initial
        // PickerEntity objects to set the picker value, and a schema that defines
        // picker properties.
        this.SPClientPeoplePicker_InitStandaloneControlWrapper(eleId, null, schema);
    }
    // Get info from the People picker
    function GetPeoplePickerValues(eleId) {
        var toSpanKey = eleId + "_TopSpan";
        var peoplePicker = null;

        // Get the people picker object from the page.
        //var peoplePicker = this.SPClientPeoplePicker.SPClientPeoplePickerDict.peoplePickerDiv_TopSpan;
        var ClientPickerDict = this.SPClientPeoplePicker.SPClientPeoplePickerDict;
        // Get the people picker object from the page.
        for (var propertyName in ClientPickerDict) {
            if (propertyName == toSpanKey) {
                peoplePicker = ClientPickerDict[propertyName];
                break;
            }
        }
        if (peoplePicker != null) {
            // Get information about all users.
            var users = peoplePicker.GetAllUserInfo();
            var userInfo = '';
            for (var i = 0; i < users.length; i++) {
                var user = users[i];
                userInfo += user['DisplayText'] + ";#";
            }
            return userInfo;
        }
        else
            return '';
    }
    // Get keys from the People picker
    function GetPeoplePickerKeys(eleId) {
        var toSpanKey = eleId + "_TopSpan";
        var peoplePicker = null;

        // Get the people picker object from the page.
        //var peoplePicker = this.SPClientPeoplePicker.SPClientPeoplePickerDict.peoplePickerDiv_TopSpan;
        var ClientPickerDict = this.SPClientPeoplePicker.SPClientPeoplePickerDict;
        // Get the people picker object from the page.
        for (var propertyName in ClientPickerDict) {
            if (propertyName == toSpanKey) {
                peoplePicker = ClientPickerDict[propertyName];
                break;
            }
        }
        if (peoplePicker != null) {
            // Get information about all users.
            var keys = peoplePicker.GetAllUserKeys();
            return keys;
        }
        else
            return '';
    }
    // Set keys to People picker
    function SetPeoplePickerKeys(eleId, loginIdOrEmailOrSearchText) {
        var toSpanKey = eleId + "_TopSpan";
        var peoplePicker = null;

        // Get the people picker object from the page.
        //var peoplePicker = this.SPClientPeoplePicker.SPClientPeoplePickerDict.peoplePickerDiv_TopSpan;
        var ClientPickerDict = this.SPClientPeoplePicker.SPClientPeoplePickerDict;
        // Get the people picker object from the page.
        for (var propertyName in ClientPickerDict) {
            if (propertyName == toSpanKey) {
                peoplePicker = ClientPickerDict[propertyName];
                break;
            }
        }
        if (peoplePicker != null) {
            peoplePicker.AddUserKeys(loginIdOrEmailOrSearchText, false); //true shows the auto-suggest box, false resolve the user
        }
    }
    // Clear All Users From People picker
    function ClearAllUsersFromPeoplePicker(eleId) {
        var toSpanKey = eleId + "_TopSpan";
        var peoplePicker = null;

        // Get the people picker object from the page.
        //var peoplePicker = this.SPClientPeoplePicker.SPClientPeoplePickerDict.peoplePickerDiv_TopSpan;
        var ClientPickerDict = this.SPClientPeoplePicker.SPClientPeoplePickerDict;
        // Get the people picker object from the page.
        for (var propertyName in ClientPickerDict) {
            if (propertyName == toSpanKey) {
                peoplePicker = ClientPickerDict[propertyName];
                break;
            }
        }
        if (peoplePicker != null) {
            peoplePicker.IterateEachProcessedUser(function (index, user) {
                peoplePicker.DeleteProcessedUser(document.getElementById(user.UserContainerElementId));
            });
        }
    }
    // On User Resolved Event For People Picker
    function OnUserResolvedEvent(eleId, callback) {
        var toSpanKey = eleId + "_TopSpan";
        var peoplePicker = null;

        // Get the people picker object from the page.
        //var peoplePicker = this.SPClientPeoplePicker.SPClientPeoplePickerDict.peoplePickerDiv_TopSpan;
        var ClientPickerDict = this.SPClientPeoplePicker.SPClientPeoplePickerDict;
        // Get the people picker object from the page.
        for (var propertyName in ClientPickerDict) {
            if (propertyName == toSpanKey) {
                peoplePicker = ClientPickerDict[propertyName];
                break;
            }
        }
        if (peoplePicker != null) {
            peoplePicker.OnUserResolvedClientScript = callback;
        }
    }
    // this will use as plugin 
    // to use this plugin you need to have div and use it as below
    /*
        $("#idOfDiv").spPeoplePicker(true,"100px");

        this will work if js file on top of this file will load and work
    */

    $.fn.spPeoplePicker = function (AllowMultipleValues, Width, accountType) {
        var eleId = $(this).attr('id');
        ExecuteOrDelayUntilScriptLoaded(function () { initializePeoplePicker(eleId, AllowMultipleValues, Width, accountType); }, 'sp.core.js');
    };

    // Query the picker for user information.
    $.fn.getUserInfo = function () {
        var eleId = $(this).attr('id');
        var spUsersInfo = GetPeoplePickerValues(eleId);
        return spUsersInfo.slice(0, -2);
    }
    // Query the People picker for user keys
    $.fn.getUserKeys = function () {
        var eleId = $(this).attr('id');
        var spUsersInfo = GetPeoplePickerKeys(eleId);
        return spUsersInfo;
    }
    // Set Keys to People picker
    $.fn.setUserKeys = function (loginIdOrEmailOrSearchText) {
        var eleId = $(this).attr('id');
        var spUsersInfo = SetPeoplePickerKeys(eleId, loginIdOrEmailOrSearchText);
        return spUsersInfo;
    }
    // Clear Peoplepicker
    $.fn.clearPeoplePicker = function () {
        var eleId = $(this).attr('id');
        ClearAllUsersFromPeoplePicker(eleId);
    }
    // Disable People picker
    $.fn.disablePeoplePicker = function () {
        var eleId = $(this).attr('id');
        $('#' + eleId + '_TopSpan_EditorInput').attr('disabled', true);
        $('div [id*="' + eleId + '"]').each(function () {
            $(this).addClass('disablePeoplePicker');
        });
    }
    // Enable People picker
    $.fn.enablePeoplePicker = function () {
        var eleId = $(this).attr('id');
        $('#' + eleId + '_TopSpan_EditorInput').attr('disabled', false);
        $('div [id*="' + eleId + '"]').each(function () {
            $(this).removeClass('disablePeoplePicker');
        });
    }

    $.fn.OnUserResolvedEvent = function (callback) {
        var eleId = $(this).attr('id');
        OnUserResolvedEvent(eleId, callback);
    }
})(jQuery);