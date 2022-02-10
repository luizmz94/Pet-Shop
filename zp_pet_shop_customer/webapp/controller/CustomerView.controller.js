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
          var modelCustomer = this.getView().getModel("Customer");
          var oModel = this.getView().getModel();

          oModel.create("/CustomersSet", modelCustomer.getData(), {
            success: function (oData, oResponse) {
              if (oResponse.statusCode == "201") {
                var msg = this.geti18nText("created");
                MessageBox.success(msg, { onClose: this.doMessageboxAction() });
                this.clearModel(modelCustomer);
              }
            }.bind(this),

            error: function (oError) {
              var oSapMessage = JSON.parse(oError.responseText);
              var msg = oSapMessage.error.message.value;
              MessageBox.error(msg);
            },
          });
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

        doMessageboxAction: function () {
          return new Promise(
            function (resolve, reject) {
              sap.m.MessageBox.confirm("Text", {
                actions: [
                  sap.m.MessageBox.Action.YES,
                  sap.m.MessageBox.Action.NO,
                ],
                onClose: function (oAction) {
                  if (oAction === sap.m.MessageBox.Action.NO) {
                    this.handleCancelBtnPress();
                  }
                }.bind(this),
              });
            }.bind(this)
          );
        },

        onDelete(oEvent) {
          var that = this;
          var oModel = this.getView().getModel();
          oModel.setDeferredGroups(["group1"]);

          var oTable = this.getView().byId("LineItemsSmartTable").getTable();
          // var oItems = oTable.getSelectedIndices();
          debugger;
          var path= oEvent.getParameter('listItem').getBindingContext().getPath();
          var selectedRow = this.byId('LineItemsSmartTable').getModel().getProperty(path);
debugger;
          for (var i = 0; i < oItems.length; i++) {
            var j = oItems[i];
            var cpfKey = oTable.getContextByIndex(j).getProperty("Cpf");

            var sDelete = oModel.createKey("/CustomersSet", { Cpf: cpfKey });

            oModel.remove(sDelete, {
              success: function (oData, oResponse) {
                // debugger;
              },
              error: function (oError) {
                // debugger;
              },
            });
          }
        },

        onEdit(oEvent) {


        },

        //     oModel.remove(sDelete , {
        //       groupId: "group1",
        //       changeSetId: "changeSetId1",
        //       success: that.successCallback,
        //       error: that.errorCallback
        //  });
        //   }
        //   oModel.submitChanges({
        //     groupId: "group1"
        // });

        onDataReceived: function () {
          var oTable = this.byId("LineItemsSmartTable");
          var i = 0;
          oTable
            .getTable()
            .getColumns()
            .forEach(function (oLine) {
              oLine.setWidth("100%");
              oLine.getParent().autoResizeColumn(i);
              i++;
            });
        },
      }
    );
  }
);
