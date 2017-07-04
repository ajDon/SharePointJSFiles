(function ($) {
  $.fn.SPEditable = function () {
    return this.each(function () {
      $(this).append("<div class='ExternalClass" + (Math.floor(Math.random() * 100000000) + 100000000) + "' style='min-height:250px !important; min-width: 500px;'></div>")

      $(this).addClass("ms-rtestate-field ms-rtefield ms-inputBox");
      $(this).find("div[class*='ExternalClass']").addClass("ms-rte-layoutszone-inner-editable ms-rtestate-write ms-rtestate-field").attr("role", "textbox").attr("aria-haspopup", "true").attr("contentEditable", "true").attr("aria-autocomplete", "both").attr("aria-autocomplete", "both").attr("aria-multiline", "true");
    });
  };
  $.fn.SPNonEditable = function () {
    return this.each(function () {
      $(this).removeClass("ms-rtestate-field ms-rtefield ms-inputBox");
      $(this).find("div[class*='ExternalClass']")
        .removeClass("ms-rte-layoutszone-inner-editable")
        .removeClass("ms-rtestate-write")
        .removeClass("ms-rtestate-field")
        .removeAttr("role aria-haspopup contentEditable aria-autocomplete aria-multiline rtedirty");
    });
  };
})(jQuery);