sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/ColumnListItem",
    "sap/m/Input",
  ],
  function (
    BaseController,
    JSONModel,
    History,
    formatter,
    MessageBox,
    Fragment,
    ColumnListItem,
    Input
  ) {
    "use strict";

    return BaseController.extend("petshop.zppetshoporders.controller.Object", {
      formatter: formatter,

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      /**
       * Called when the worklist controller is instantiated.
       * @public
       */
      onInit: function () {
        // Model used to manipulate control states. The chosen values make sure,
        // detail page shows busy indication immediately so there is no break in
        // between the busy indication for loading the view's meta data
        var oViewModel = new JSONModel({
          busy: true,
          delay: 0,
        });

        this.getRouter()
          .getRoute("object")
          .attachPatternMatched(this._onObjectMatched, this);
        this.setModel(oViewModel, "objectView");

        this._data = {
          Products: [],
        };

        this.jModel = new JSONModel(this._data);

        this.oEditableTemplate = new ColumnListItem({
          cells: [
            new Input({
              value: "{Name}",
            }),
            new Input({
              value: "{Quantity}",
              description: "{UoM}",
            }),
            new Input({
              value: "{WeightMeasure}",
              description: "{WeightUnit}",
            }),
            new Input({
              value: "{Price}",
              description: "{CurrencyCode}",
            }),
          ],
        });
      },
      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      onBeforeRendering: function () {
        var tableOrderNew = this.byId("tableProducts");
        if (tableOrderNew) {
          tableOrderNew.setModel(this.jModel, "servicesAndProducts");
        }
      },

      addRow: function (oArg) {
        debugger;
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
        // this.getModel("createOrderView").setProperty("/showFooter", true);
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
          this.getModel("createOrderView").setProperty("/showFooter", false);
        }
      },

      /**
       * Event handler  for navigating back.
       * It there is a history entry we go one step back in the browser history
       * If not, it will replace the current entry of the browser history with the worklist route.
       * @public
       */
      onNavBack: function () {
        var sPreviousHash = History.getInstance().getPreviousHash();
        if (sPreviousHash !== undefined) {
          // eslint-disable-next-line sap-no-history-manipulation
          history.go(-1);
        } else {
          this.getRouter().navTo("worklist", {}, true);
        }
      },

      /* =========================================================== */
      /* internal methods                                            */
      /* =========================================================== */

      /**
       * Binds the view to the object path.
       * @function
       * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
       * @private
       */
      _onObjectMatched: function (oEvent) {
        var sOrderId = oEvent.getParameter("arguments").orderId;
        this._bindView("/OrderHeadersReportSet" + sOrderId);
      },

      /**
       * Binds the view to the object path.
       * @function
       * @param {string} sObjectPath path to the object to be bound
       * @private
       */
      _bindView: function (sObjectPath) {
        var oViewModel = this.getModel("objectView");

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
          oModel = oView.getModel(),
          oViewModel = this.getModel("objectView"),
          oElementBinding = oView.getElementBinding();

        // No data for the binding
        if (!oElementBinding.getBoundContext()) {
          this.getRouter().getTargets().display("objectNotFound");
          return;
        }

        var oResourceBundle = this.getResourceBundle(),
          oOrder = oView.getBindingContext().getObject(),
          sOrderId = oOrder.Id,
          sOrderName = oOrder.Name;

        var path = oElementBinding.sPath + "/GetItemsReport";

        oModel.read(path, {
          success: function (oData, oResponse) {
            debugger;

            this._data.Products = oData.results;
            // this._data = {
            //   Products: oData.results,
            // };

            this.jModel.refresh()
            // this.jModel.setData({
            //   Products: oData.results,
            // });
            // this.getOwnerComponent().setModel(oTableModel, "tableModel");
          }.bind(this),
          error: function (oError) {
            //console.log("Error!");
          },
        });

        oViewModel.setProperty("/busy", false);
      },

      onFieldChange: function (evt) {
        var oModel = this.getView().getModel();

        var change = evt.getParameter("changeEvent");
        if (change) {
          debugger;
          var sPath = change.getSource().getBindingContext().getPath();
          var oEntry = change.getSource().getBindingContext().getObject();

          oEntry.Total = (oEntry.Quantity * oEntry.Value).toString();

          oModel.update(sPath, oEntry, {
            method: "PUT",
            success: function (data) {},
            error: function (oError) {
              var oSapMessage = JSON.parse(oError.responseText);
              var msg = oSapMessage.error.message.value;
              MessageBox.error(msg);
            }.bind(this),
          });
        }
      },

      onAddItem: function () {
        debugger;

        var oSmartable = this.byId("OrderItemsSmartTable");
        var oItem = oSmartable.getTable().getItems()[0];

        var columnListItemNewLine = new sap.m.ColumnListItem();
        var oContext = oItem.getBindingContext();
        columnListItemNewLine.setBindingContext(oContext);

        oSmartable.addItem(columnListItemNewLine);
      },

      _createNewLine: function (oEvent) {
        var columnListItemNewLine = new sap.m.ColumnListItem({
          type: sap.m.ListType.Inactive,
          unread: false,
          vAlign: "Middle",
          cells: [
            // add created controls to item
            new sap.m.Input({ type: "Text", value: "Enter name" }),
            new sap.m.Input({ type: "Text", value: "Enter description" }),
            new sap.m.Input({ type: "Text", value: "Enter price" }),
          ],
        });
        this._oTable.addItem(columnListItemNewLine);
      },

      onToggled: function (oEvent) {
        var oViewModel = this.getModel("objectView");
      },
    });
  }
);
