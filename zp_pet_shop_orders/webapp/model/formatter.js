sap.ui.define([], function () {
  "use strict";

  return {
    /**
     * Rounds the number unit value to 2 digits
     * @public
     * @param {string} sValue the number string to be rounded
     * @returns {string} sValue with 2 digits rounded
     */
    numberUnit: function (sValue) {
      if (!sValue) {
        return "";
      }
      return parseFloat(sValue).toFixed(2);
    },

    category: function (sValue) {
      var resourceBundle = this.getView().getModel("i18n").getResourceBundle();
      if (sValue === "SRV") {
        return resourceBundle.getText("service");
      } else if ( sValue === "PRT" )
      {
        return resourceBundle.getText("product");
      }
    },
  };
});
