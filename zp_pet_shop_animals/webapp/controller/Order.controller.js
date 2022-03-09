sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel"],
  function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("petshop.zppetshopanimals.controller.Order", {
      onInit: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter
          .getRoute("order")
          .attachPatternMatched(this._onObjectMatched, this);

        var oOrderModel = new JSONModel({
          busy: false,
          delay: 0,
          showFooter: false,
        });

        this.setModel(oOrderModel, "orderView");

        this._data = {
          Products: [
            // { Category: "", Description: "", Quantity:1, Unit:"", Value:0, Total:0},
          ],
        };

        this.jModel = new JSONModel(this._data);
      },

      onBeforeRendering: function () {
        this.byId("tableProducts").setModel(this.jModel, "servicesAndProducts");
      },

      onNavBack: function () {
        history.go(-1);
      },
      _onObjectMatched: function (oEvent) {
        var sAnimalId = oEvent.getParameter("arguments").animalId;
        this.getModel()
          .metadataLoaded()
          .then(
            function () {
              var sAnimalPath = this.getModel().createKey("AnimalsSet", {
                Id: sAnimalId,
              });
              this._bindView("/" + sAnimalPath);
            }.bind(this)
          );
      },

      _bindView: function (sObjectPath) {
        // Set busy indicator during view binding
        var oViewModel = this.getModel("orderView");

        // If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
        oViewModel.setProperty("/busy", false);

        this.getView().bindElement({
          path: sObjectPath,
          events: {
            change: this._onBindingChange.bind(this),
            dataRequested: function () {
              oViewModel.setProperty("/busy", true);
            },
            dataReceived: function () {
              oViewModel.setProperty("/busy", false);
            },
          },
        });
      },

      _onBindingChange: function () {
        var oView = this.getView(),
          oElementBinding = oView.getElementBinding();

        // No data for the binding
        if (!oElementBinding.getBoundContext()) {
          this.getRouter().getTargets().display("detailObjectNotFound");
          // if object could not be found, the selection in the master list
          // does not make sense anymore.
          this.getOwnerComponent().oListSelector.clearMasterListSelection();
          return;
        }
        var sPath = oElementBinding.getPath(),
          oResourceBundle = this.getResourceBundle(),
          oObject = oView.getModel().getObject(sPath),
          sObjectId = oObject.Cpf,
          sObjectName = oObject.Name,
          oViewModel = this.getModel("detailView");

        this.getOwnerComponent().oListSelector.selectAListItem(sPath);

        this._clearOrderTable();

        // oViewModel.setProperty(
        //   "/shareSendEmailSubject",
        //   oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId])
        // );
        // oViewModel.setProperty(
        //   "/shareSendEmailMessage",
        //   oResourceBundle.getText("shareSendEmailObjectMessage", [
        //     sObjectName,
        //     sObjectId,
        //     location.href,
        //   ])
        // );
      },

      addRow: function (oArg) {
        this._data.Products.push({
          Category: "",
          Description: "",
          Quantity: 0,
          Unit: "",
          Value: 0,
          Total: 0,
        });
        this.jModel.refresh(); //which will add the new record

        // var oViewModel = this.getModel("orderView");
        this.getModel("orderView").setProperty("/showFooter", true);
      },

      deleteRow: function (oEvent) {
        var deleteRecord = oEvent
          .getSource()
          .getBindingContext("servicesAndProducts")
          .getObject();
        for (var i = 0; i < this._data.Products.length; i++) {
          if (this._data.Products[i] == deleteRecord) {
            //	pop this._data.Products[i]
            this._data.Products.splice(i, 1); //removing 1 record from i th index.
            this.jModel.refresh();
            break; //quit the loop
          }
        }
        if (this._data.Products.length == 0) {
          this.getModel("orderView").setProperty("/showFooter", false);
        }
      },

      fetchRecords: function (oArg) {
        //data will be in this._data.Products
        this.byId("output").setValue(JSON.stringify(this._data.Products));
        console.log(this._data.Products);
      },

      _saveOrder: function () {},

      _clearOrderTable: function () {
        this._data.Products.splice(0, 100);
        this.jModel.refresh();
        this.getModel("orderView").setProperty("/showFooter", false);
      },
    });
  }
);
