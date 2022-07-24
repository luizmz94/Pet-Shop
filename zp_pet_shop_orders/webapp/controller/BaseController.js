sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/library",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
  ],
  function (Controller, UIComponent, mobileLibrary, MessageBox, JSONModel) {
    "use strict";   

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return Controller.extend(
      "petshop.zppetshoporders.controller.BaseController",
      {
        /**
         * Convenience method for accessing the router.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
          return UIComponent.getRouterFor(this);
        },

        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
          return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
          return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
          return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Event handler when the share by E-Mail button has been clicked
         * @public
         */
        onShareEmailPress: function () {
          var oViewModel =
            this.getModel("objectView") || this.getModel("worklistView");
          URLHelper.triggerEmail(
            null,
            oViewModel.getProperty("/shareSendEmailSubject"),
            oViewModel.getProperty("/shareSendEmailMessage")
          );
        },

        submitError: function (oError) {
          var responseBody = oError.responseText;
          try {
            var body = JSON.parse(responseBody);
            var errorDetails = body.error.innererror.errordetails;
            if (errorDetails) {
              if (errorDetails.length > 0) {
                for (i = 0; i < errorDetails.length; i++) {
                  MessageBox.error(errorDetails[i].message);
                }
              } else MessageBox.error(body.error.message.value);
            } else MessageBox.error(body.error.message.value);
          } catch (err) {
            try {
              //the error is in xml format. Technical error by framework
              switch (typeof responseBody) {
                case "string": // XML or simple text
                  if (responseBody.indexOf("<?xml") > -1) {
                    var oXML = jQuery.parseXML(responseBody);
                    var oXMLMsg = oXML.querySelector("message");
                    if (oXMLMsg) MessageBox.error(oXMLMsg.textContent);
                  } else MessageBox.error(responseBody);

                  break;
                case "object": // Exception
                  MessageBox.error(responseBody.toString());
                  break;
              }
            } catch (err) {
              MessageBox.error("common error message");
            }
          }
        },

        submitSuccess: function (oResponse) {
          var oSapMessage = JSON.parse(oResponse.headers["sap-message"]);
          MessageBox.success(oSapMessage.message);
        },

        ShowObject: function (oItem) {
          this.getRouter().navTo("object", {
            orderId: oItem
              .getBindingContext()
              .getPath()
              .substring("/OrderHeadersReportSet".length),
          });
        },
        ShowObjectById: function (OrderId) {
          this.getRouter().navTo("object", {
            orderId: "('"+ OrderId + "')",
          });
        },
      }
    );
  }
);