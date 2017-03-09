(function () {
    if (RegisterSod != undefined) {
        RegisterSod('jquery.js',_spPageContextInfo.webAbsoluteUrl + '/SiteAssets/JS/jquery-1.12.4.min.js');
        RegisterSod('CRUD_Operations.js',_spPageContextInfo.webAbsoluteUrl + '/SiteAssets/JS/CRUD_Operations.js');
        RegisterSod('SPPeoplePickerPlugin.js',_spPageContextInfo.webAbsoluteUrl + '/SiteAssets/JS/SPPeoplePickerPlugin.js');

        RegisterSodDep('CRUD_Operations.js','jquery.js')
        RegisterSodDep('SPPeoplePickerPlugin.js','jquery.js')
    }
})();