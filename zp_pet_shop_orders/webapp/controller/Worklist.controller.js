sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
  ],
  function (
    BaseController,
    JSONModel,
    formatter,
    Filter,
    FilterOperator,
    Fragment
  ) {
    "use strict";

    return BaseController.extend(
      "petshop.zppetshoporders.controller.Worklist",
      {
        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit: function () {

          debugger;
          this._smartFilterBar = this.getView().byId("smartFilterBar");
          // this._smartFilterBar.setLiveMode(false);

          this.setInitialSortOrder();

          var oViewModel;

          // keeps the search state
          this._aTableSearchState = [];

          // Model used to manipulate control states
          oViewModel = new JSONModel({
            worklistTableTitle:
              this.getResourceBundle().getText("worklistTableTitle"),
            shareSendEmailSubject: this.getResourceBundle().getText(
              "shareSendEmailWorklistSubject"
            ),
            shareSendEmailMessage: this.getResourceBundle().getText(
              "shareSendEmailWorklistMessage",
              [location.href]
            ),
            tableNoDataText:
              this.getResourceBundle().getText("tableNoDataText"),
          });
          this.setModel(oViewModel, "worklistView");

          this._data = {
            Products: [],
          };

          this.jModel = new JSONModel(this._data);
        },

        onBeforeExport: function (oEvt) {
          var mExcelSettings = oEvt.getParameter("exportSettings");

          // Disable Worker as Mockserver is used in Demokit sample
          mExcelSettings.worker = false;
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        onUpdateFinished: function (oEvent) {
          // update the worklist's object counter after the table update
          var sTitle,
            oTable = oEvent.getSource(),
            iTotalItems = oEvent.getParameter("total");
          // only update the counter if the length is final and
          // the table is not empty
          if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
            sTitle = this.getResourceBundle().getText(
              "worklistTableTitleCount",
              [iTotalItems]
            );
          } else {
            sTitle = this.getResourceBundle().getText("worklistTableTitle");
          }
          this.getModel("worklistView").setProperty(
            "/worklistTableTitle",
            sTitle
          );
        },

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress: function (oEvent) {
          // The source is the list item that got pressed
          this._showObject(oEvent.getSource());
        },

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        onNavBack: function () {
          // eslint-disable-next-line sap-no-history-manipulation
          history.go(-1);
        },

        onSearch: function (oEvent) {
          if (oEvent.getParameters().refreshButtonPressed) {
            // Search field's 'refresh' button has been pressed.
            // This is visible if you select any main list item.
            // In this case no new search is triggered, we only
            // refresh the list binding.
            this.onRefresh();
          } else {
            var aTableSearchState = [];
            var sQuery = oEvent.getParameter("query");

            if (sQuery && sQuery.length > 0) {
              aTableSearchState = [
                new Filter("Id", FilterOperator.Contains, sQuery),
              ];
            }
            this._applySearch(aTableSearchState);
          }
        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh: function () {
          var oTable = this.byId("table");
          oTable.getBinding("items").refresh();
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject: function (oItem) {
          this.getRouter().navTo("object", {
            orderId: oItem
              .getBindingContext()
              .getPath()
              .substring("/OrderHeadersReportSet".length),
          });
        },

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function (aTableSearchState) {
          var oTable = this.byId("table"),
            oViewModel = this.getModel("worklistView");
          oTable.getBinding("items").filter(aTableSearchState, "Application");
          // changes the noDataText of the list in case there are no filter results
          if (aTableSearchState.length !== 0) {
            oViewModel.setProperty(
              "/tableNoDataText",
              this.getResourceBundle().getText("worklistNoDataWithSearchText")
            );
          }
        },

        _onCreate: function () {
          // this.getModel("appView").setProperty("/keys/cpf/blocked", false);

          this.gbEditing = false;
          var oView = this.getView();
          if (!this.byId("openDialog")) {
            Fragment.load({
              id: oView.getId(),
              name: "petshop.zppetshoporders.view.createOrder",
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              oDialog.open();
              var tableOrderNew = oView.byId("tableProducts");
              if (tableOrderNew) {
                tableOrderNew.setModel(this.jModel, "servicesAndProducts");
              }
            }.bind(this));
          } else {
            this.byId("openDialog").open();
            var tableOrderNew = this.byId("tableProducts");
            if (tableOrderNew) {
              tableOrderNew.setModel(this.jModel, "servicesAndProducts");
            }
          }
        },

        addRow: function (oArg) {
          this._data.Products.push({
            Id: "",
            Itemid: "",
            Category: "",
            Serviceproductid: "",
            Description: "",
            Quantity: "",
            Unit: "",
            Value: "",
            Total: "",
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

        _onChangeQuantity: function (oEvent) {
          var rowChanged = oEvent
            .getSource()
            .getBindingContext("servicesAndProducts")
            .getObject();
          rowChanged.Total = rowChanged.Quantity * rowChanged.Value;
        },
        _onChangeTotal: function (oEvent) {
          var rowChanged = oEvent
            .getSource()
            .getBindingContext("servicesAndProducts")
            .getObject();
          rowChanged.Value = rowChanged.Total / rowChanged.Quantity;
        },

        _onChangeDescription: function (oEvent) {
          var rowChanged = oEvent
            .getSource()
            .getBindingContext("servicesAndProducts")
            .getObject();

          var suggestions = oEvent
            .getSource()
            .getSuggestionItemByKey(rowChanged.Description);

          if (suggestions) {
            var suggestionItem = suggestions.getBindingContext().getObject();
            rowChanged.Value = suggestionItem.Value;
            rowChanged.Category = suggestionItem.Category;
            rowChanged.Unit = suggestionItem.Unit;
            if (suggestionItem.Category == "SRV") {
              rowChanged.Quantity = "1";
              rowChanged.Total = rowChanged.Value;
            }
          } else {
            rowChanged.Value = "";
            rowChanged.Category = "";
            rowChanged.Unit = "";
            rowChanged.Quantity = "";
            rowChanged.Total = "";
          }
        },

        onBeforeRendering: function () {
          var tableOrderNew = this.byId("tableProducts");
          if (tableOrderNew) {
            tableOrderNew.setModel(this.jModel, "servicesAndProducts");
          }
        },

        handleSaveBtnPress: function (oEvent) {
          var oModelAnimal = this.getView().getModel("Animal");
          var oModel = this.getView().getModel();

          var oCurrentAnimal = oModelAnimal.getData();
          var sUpdate = oModel.createKey("/AnimalsSet", {
            Id: oCurrentAnimal.Id,
          });
          oModel.update(sUpdate, oCurrentAnimal, {
            method: "PUT",
            success: function (data, oResponse) {
              var msg = this.getResourceBundle().getText("updated");
              MessageBox.success(msg);
              this.handleCancelBtnPress();
              oModel.refresh();
            }.bind(this),
            error: function (oError) {
              var oSapMessage = JSON.parse(oError.responseText);
              var msg = oSapMessage.error.message.value;
              MessageBox.error(msg);
            }.bind(this),
          });
        },

        handleCancelBtnPress: function () {
          this.byId("openDialog").close();
          this._clearOrderTable();
        },

        _clearOrderTable: function () {
          this._data.Products.splice(0, 100);
          this.jModel.refresh();
        },


        _addOrder: function (oItem) {
          this.getRouter().navTo("orderCreate", {
            orderId: "New",
          });
        },

        setInitialSortOrder: function() {
          var oSmartTable = this.getView().byId("LineItemsSmartTable");            
          oSmartTable.applyVariant({
               sort: {
                        sortItems: [{ 
                                       columnKey: "Id", 
                                       operation:"Descending"}
                                   ]
                     }
          });
  }

      }
    );
  }
);
