sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/core/Fragment"],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, Fragment) {
    "use strict";

    return Controller.extend(
      "petshop.zppetshopcustomer.controller.CustomerView",
      {
        onInit: function () {},
        onBeforeExport: function (oEvt) {
          var mExcelSettings = oEvt.getParameter("exportSettings");

          // Disable Worker as Mockserver is used in Demokit sample
          mExcelSettings.worker = false;
        },
        onCreate: function () {
          if (!this.newCustomerDialog) {
            this.newCustomerDialog = sap.ui.xmlfragment(
              "petshop.zppetshopcustomer.view.Register",
              this
            );
            var oModel = new sap.ui.model.json.JSONModel();
            this.newCustomerDialog.setModel(oModel);
          }
          this.getView().addDependent(this.newCustomerDialog);
          this.newCustomerDialog.open();
        },

        handleSaveBtnPress: function (oEvent) {
          var modelCustomer = this.getView().getModel("Customer");
          var oModel = this.getView().getModel();

          oModel.create("/CustomersSet", modelCustomer.getData(), {
            success: function (oData, oResponse) {
              var oSapMessage = JSON.parse(oResponse.headers["sap-message"]);
              MessageToast.show(oSapMessage.message);
            },

            error: function (oError) {},
          });
        },

        handleCancelBtnPress: function () {
          this.newCustomerDialog.close();
        },
      }
    );
  }
);
