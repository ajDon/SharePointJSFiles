Type.registerNamespace('JCIAPACEmtyList')

var JCIAPACEmtyList = {
    emptyListMessage:'',
	renderItemsOnPage: function (message) {
        this.emptyListMessage = message;
        this.customizeCustomListItemFieldRendering();
    },
    customizeCustomListItemFieldRendering: function () {
    	//   Initialize the variables for overrides objects
        var overrideCtx = {};
        overrideCtx.Templates = {};
        
        overrideCtx.Templates.OnPreRender = this.csrNoListItem;
        SPClientTemplates.TemplateManager.RegisterTemplateOverrides(overrideCtx);
    },
    csrNoListItem: function (ctx) {
    	ctx.ListSchema.NoListItem = JCIAPACEmtyList.emptyListMessage;
    }
}

JCIAPACEmtyList.renderItemsOnPage('No Data available...');