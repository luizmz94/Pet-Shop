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
        });

        this.setModel(oOrderModel, "orderView");

        debugger;
        this._data = {
          Products: [
            { Category: "a", Description: "b", Quantity:"c", Unit:"d", Value:"e"},
          ],
        };

        this.jModel = new sap.ui.model.json.JSONModel();
        this.jModel.setData(this._data);
      },  

      onBeforeRendering: function () {
        this.byId("ins").setModel(this.jModel);
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
        // var cc = oEvent.getParameter("arguments").invoicePath;
        // var textId = this.getView().byId("myTestId");
        // textId.setText(cc);
        // var cc1 = oEvent.getParameter("arguments").invoicePath1;
        // var textId1 = this.getView().byId("TestId");
        // textId1.setText(cc1);
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
        this._data.Products.push({ Category: "", Description: "", Quantity:"", Unit:"", Value:""});
        this.jModel.refresh(); //which will add the new record
      },

      deleteRow: function (oArg) {
        var deleteRecord = oArg.getSource().getBindingContext().getObject();
        for (var i = 0; i < this._data.Products.length; i++) {
          if (this._data.Products[i] == deleteRecord) {
            //	pop this._data.Products[i]
            this._data.Products.splice(i, 1); //removing 1 record from i th index.
            this.jModel.refresh();
            break; //quit the loop
          }
        }
      },

      fetchRecords: function (oArg) {
        //data will be in this._data.Products
        this.byId('output').setValue(JSON.stringify(this._data.Products));	
        console.log(this._data.Products);
      },
    });
  }
);
