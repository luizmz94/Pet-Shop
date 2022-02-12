sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
  ],

  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */

  function (Controller, Fragment, MessageToast, MessageBox) {
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
          this.gbEditing = false;
          var oView = this.getView();
          if (!this.byId("openDialog")) {
            Fragment.load({
              id: oView.getId(),
              name: "petshop.zppetshopcustomer.view.Register",
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              oDialog.open();
            });
          } else {
            this.byId("openDialog").open();
          }
        },

        handleSaveBtnPress: function (oEvent) {
          var oModelCustomer = this.getView().getModel("Customer");
          var oModel = this.getView().getModel();

          if (!this.gbEditing) {
            oModel.create("/CustomersSet", oModelCustomer.getData(), {
              success: function (oData, oResponse) {
                if (oResponse.statusCode == "201") {
                  var msg = this.geti18nText("created");
                  // MessageBox.success(msg, { onClose: this.doMessageboxAction() });
                  MessageBox.success(msg);
                  this.clearModel(oModelCustomer);
                  this.handleCancelBtnPress();
                }
              }.bind(this),

              error: function (oError) {
                var oSapMessage = JSON.parse(oError.responseText);
                var msg = oSapMessage.error.message.value;
                MessageBox.error(msg);
              },
            });
          } else {
            var oCurrentCustomer = oModelCustomer.getData();
            var sUpdate = oModel.createKey("/CustomersSet", {
              Cpf: oCurrentCustomer.Cpf,
            });
            oModel.update(sUpdate, oCurrentCustomer, {
              method: "PUT",
              success: function (data, oResponse) {
                var msg = this.geti18nText("updated");
                MessageBox.success(msg);
                this.clearModel(oModelCustomer);
                this.handleCancelBtnPress();
                oModel.refresh();
              }.bind(this),
              error: function (oError) {
                var oSapMessage = JSON.parse(oError.responseText);
                var msg = oSapMessage.error.message.value;
                MessageBox.error(msg);
              }.bind(this),
            });
          }
        },

        handleCancelBtnPress: function () {
          this.byId("openDialog").close();
          var modelCustomer = this.getView().getModel("Customer");
          this.clearModel(modelCustomer);
        },

        geti18nText: function (sKey) {
          var msg = this.getView()
            .getModel("i18n")
            .getResourceBundle()
            .getText(sKey);
          return msg;
        },

        clearModel: function (oModel) {
          oModel.setData({
            Cpf: "",
            Name: "",
            Address: "",
            Telephone: "",
          });
        },

        onDelete(oEvent) {
          var oModel = this.getView().getModel();
          var oTable = this.getView().byId("LineItemsSmartTable").getTable();
          var oItems = oTable._aSelectedPaths;

          for (var item in oItems) {
            oModel.remove(oItems[item], {
              success: function (oData, oResponse) {},
              error: function (oError) {
                var oSapMessage = JSON.parse(oError.responseText);
                var msg = oSapMessage.error.message.value;
                MessageBox.error(msg);
              },
            });
          }
        },

        handleEditStudent(oEvent) {
          var oView = this.getView();
          var oCurrentCustomer = oEvent
            .getSource()
            .getBindingContext()
            .getObject();
          var modelCustomer = oView.getModel("Customer");
          modelCustomer.setData(oCurrentCustomer);
          if (!this.byId("openDialog")) {
            Fragment.load({
              id: oView.getId(),
              name: "petshop.zppetshopcustomer.view.Register",
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              oDialog.open();
            });
          } else {
            this.byId("openDialog").open();
          }
          this.gbEditing = true;
        },

        handleDeleteStudent(oEvent) {
          var oModel = this.getView().getModel();
          var oCurrentCustomer = oEvent
            .getSource()
            .getBindingContext()
            .getObject();

          var sDelete = oModel.createKey("/CustomersSet", {
            Cpf: oCurrentCustomer.Cpf,
          });

          oModel.remove(sDelete, {
            success: function (oData, oResponse) {},
            error: function (oError) {
              var oSapMessage = JSON.parse(oError.responseText);
              var msg = oSapMessage.error.message.value;
              MessageBox.error(msg);
            },
          });
        },
      }
    );
  }
);
