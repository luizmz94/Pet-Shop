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
    "sap/m/Button",
    "sap/m/Text",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Binding",
  ],
  function (
    BaseController,
    JSONModel,
    History,
    formatter,
    MessageBox,
    Fragment,
    ColumnListItem,
    Input,
    Button,
    Text,
    Filter,
    FilterOperator,
    Binding
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
          editButtonVisible: true,
          cancelButtonVisible: false,
          saveButtonVisible: false,
          addButtonVisible: false,
          showFooter: false,
          messageIcon: "sap-icon://message-success",
        });

        this.getRouter()
          .getRoute("object")
          .attachPatternMatched(this._onObjectMatched, this);
        this.setModel(oViewModel, "objectView");

        this._data = {
          Products: [],
        };

        this.jModel = new JSONModel(this._data);

        this.oTable = this.byId("tableProducts");
        this.oTable.setModel(this.jModel);
        if (!this.oReadOnlyTemplate) {
          this.oReadOnlyTemplate = this.oTable.getBindingInfo("items").template;
        }
        // this.rebindTable(this.oReadOnlyTemplate, "Navigation");

        var that = this;
        if (!this.oEditableTemplate) {
          this.oEditableTemplate = new ColumnListItem({
            cells: [
              new Button({
                icon: "sap-icon://delete",
                press: that.deleteRow.bind(this),
                type: "Reject",
              }),
              // new Input({
              //   id: "Serviceproductid",
              //   value: "{servicesAndProducts>Serviceproductid}",
              //   required: true,
              //   showValueHelp: true,
              //   valueHelpRequest: that.onValueHelpRequest.bind(that),
              // }),

              // new Text({
              //   id: "InputDescription",
              //   text: "{servicesAndProducts>Description}",
              // }),

              new Input({
                // id: this.getView().getId(),
                value: "{servicesAndProducts>Description}",
                required: true,
                showValueHelp: true,
                valueHelpRequest: that.onValueHelpRequest.bind(that),
              }),

              // new Text({
              //   id: "InputCategory",
              //   text: {
              //     path: "servicesAndProducts>Category",
              //     formatter: that.formatter.category.bind(that),
              //   },
              // }),

              new sap.m.ComboBox({
                // id: "multiComboBox",
                value: "",
                selectedKey: "{servicesAndProducts>Category}",
                items: [
                  new sap.ui.core.Item({ key: "SRV", text: "Serviço" }),
                  new sap.ui.core.Item({ key: "PRT", text: "Produto" }),
                ],
              }),

              new Input({
                // id: "inputQuantity",
                value: "{servicesAndProducts>Quantity}",
                change: that._onChangeQuantity.bind(that),
                type: "Number",
                showClearIcon: true,
                required: true,
              }),

              new Input({
                // id: "InputUnit",
                value: "{servicesAndProducts>Unit}",
                // showClearIcon: true,
                // required: true,
                showSuggestion: true,
                suggestionItems: {
                  path: "/HT006Set",
                  templateShareable: false,
                  template: new sap.ui.core.ListItem({
                    // id: "suggestUnit",
                    text: "{/HT006Set/Msehi}",
                    key: "{/HT006Set/Msehi}",
                    additionalText: "{/HT006Set/Msehl}",
                  }),
                },
              }),
              new Input({
                // id: "InputValue",
                value: "{servicesAndProducts>Value}",
                type: "Number",
                change: that._onChangeQuantity.bind(that),
                showClearIcon: true,
                required: true,
              }),

              new Input({
                // id: "InputTotal",
                value: "{servicesAndProducts>Total}",
                type: "Number",
                change: that._onChangeTotal.bind(that),
                showClearIcon: true,
                required: true,
              }),
            ],
          });
        }
        var oMessageManager;
        oMessageManager = sap.ui.getCore().getMessageManager();
        this.getView().setModel(oMessageManager.getMessageModel(), "message");

        // activate automatic message generation for complete view
        oMessageManager.registerObject(this.getView(), true);
      },

      destroy: function () {
        // this._oErrorHandler.destroy();
        // if (this.oRouteHandler) {
        //   this.oRouteHandler.destroy();
        // }
        // call the base component's destroy function
        sap.ui.getCore().getMessageManager().removeAllMessages();
        // sap.ui.core.UIComponent.prototype.destroy.apply(this, arguments);
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

      onEdit: function () {
        this.editMode = true;
        this.rebindTable(this.oEditableTemplate, "Edit");
        var oViewModel = this.getModel("objectView");
        oViewModel.setProperty("/editButtonVisible", false);
        oViewModel.setProperty("/cancelButtonVisible", true);
        oViewModel.setProperty("/saveButtonVisible", true);
        oViewModel.setProperty("/addButtonVisible", true);
        oViewModel.setProperty("/showFooter", true);
      },

      onSave: function (oEvent) {
        this.editMode = false;
        this.rebindTable(this.oReadOnlyTemplate, "Navigation");
        var oViewModel = this.getModel("objectView");
        oViewModel.setProperty("/editButtonVisible", true);
        oViewModel.setProperty("/addButtonVisible", false);
        oViewModel.setProperty("/cancelButtonVisible", false);
        oViewModel.setProperty("/saveButtonVisible", false);

        var payload = {
          Key: "1",
          Json: JSON.stringify(this._data.Products),
        };
        var oModel = this.getView().getModel();
        oModel.create("/OrderItemsJsonSet", payload, {
          success: function (oData, oResponse) {
            this._bindView(this.getView().getBindingContext().getPath());
          }.bind(this),
          error: function (oError) {
            this.submitError(oError);
          }.bind(this),
        });
      },

      onCancel: function () {
        var oModel = this.getView().getModel();
        var path = this.getView().getElementBinding().sPath + "/GetItemsReport";

        oModel.read(path, {
          success: function (oData, oResponse) {
            this._data.Products = oData.results;
            this.jModel.refresh();
          }.bind(this),
          error: function (oError) {},
        });

        this.editMode = false;
        this.rebindTable(this.oReadOnlyTemplate, "Navigation");
        var oViewModel = this.getModel("objectView");
        oViewModel.setProperty("/editButtonVisible", true);
        oViewModel.setProperty("/addButtonVisible", false);
        oViewModel.setProperty("/cancelButtonVisible", false);
        oViewModel.setProperty("/saveButtonVisible", false);

        this.getModel("objectView").setProperty("/showFooter", false);
      },

      rebindTable: function (oTemplate, sKeyboardMode) {
        this.oTable
          .bindItems({
            path: "servicesAndProducts>/Products",
            template: oTemplate,
            templateShareable: true,
            key: "Id",
          })
          .setKeyboardMode(sKeyboardMode);
      },

      addRow: function (oEvent) {
        var oItems = this.oTable.getItems();
        var orderId = this.oView.getBindingContext().getObject().Id;
        var nextOrderItem = (oItems.length + 1).toString();

        this._data.Products.push({
          Id: orderId,
          Itemid: nextOrderItem,
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

        this.jModel.refresh();
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
        // if (this._data.Products.length == 0) {
        //   this.getModel("createOrderView").setProperty("/showFooter", false);
        // }

        var oModel = this.getView().getModel();

        if (deleteRecord.Itemid.length !== 4) {
          return;
        } else {
          var sDelete = oModel.createKey("/OrderItemsSet", {
            Id: deleteRecord.Id,
            Itemid: deleteRecord.Itemid,
          });

          oModel.remove(sDelete, {
            success: function (oData, oResponse) {}.bind(this),
            error: function (oError) {
              this.submitError(oError);
            }.bind(this),
          });
        }
      },

      /**
       * Event handler  for navigating back.
       * It there is a history entry we go one step back in the browser history
       * If not, it will replace the current entry of the browser history with the worklist route.
       * @public
       */
      onNavBack: function () {
        var oViewModel = this.getModel("objectView");

        oViewModel.setProperty("/editButtonVisible", true);
        oViewModel.setProperty("/saveButtonVisible", false);
        oViewModel.setProperty("/addButtonVisible", false);

        this.rebindTable(this.oReadOnlyTemplate, "Navigation");

        oViewModel.setProperty("/showFooter", false);
        sap.ui.getCore().getMessageManager().removeAllMessages();
        
        // var sPreviousHash = History.getInstance().getPreviousHash();
        // if (sPreviousHash !== undefined) {
        //   history.go(-1);
        // } else {
        //   this.getRouter().navTo("worklist", {}, true);
        // }
        this.getRouter().navTo("worklist", {}, true);
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
            this._data.Products = oData.results;
            this.jModel.refresh();
          }.bind(this),
          error: function (oError) {},
        });
        oViewModel.setProperty("/busy", false);
      },

      onFieldChange: function (evt) {
        var oModel = this.getView().getModel();

        var change = evt.getParameter("changeEvent");
        if (change) {
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
        var oSmartable = this.byId("OrderItemsSmartTable");
        var oItem = oSmartable.getTable().getItems()[0];

        var columnListItemNewLine = new sap.m.ColumnListItem();
        var oContext = oItem.getBindingContext();
        columnListItemNewLine.setBindingContext(oContext);

        oSmartable.addItem(columnListItemNewLine);
      },

      onToggled: function (oEvent) {
        var oViewModel = this.getModel("objectView");
      },

      onValueHelpRequest: function (oEvent) {
        this.idItem = oEvent.getSource().getParent().getId();

        var sInputValue = oEvent.getSource().getValue(),
          oView = this.getView();

        if (!this._pValueHelpDialog) {
          this._pValueHelpDialog = Fragment.load({
            id: oView.getId(),
            name: "petshop.zppetshoporders.view.ValueHelpPrdSrv",
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }
        this._pValueHelpDialog.then(function (oDialog) {
          // Create a filter for the binding
          oDialog.getBinding("items").filter([
            // new Filter("Name", FilterOperator.Contains, sInputValue),

            new Filter({
              filters: [
                new sap.ui.model.Filter(
                  "Description",
                  FilterOperator.Contains,
                  sInputValue
                ),
              ],
              and: false,
            }),
          ]);
          // Open ValueHelpDialog filtered by the input's value
          oDialog.open(sInputValue);
        });
      },

      onValueHelpSearch: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var oFilter = new Filter({
          filters: [
            new sap.ui.model.Filter(
              "Description",
              FilterOperator.Contains,
              sValue
            ),
          ],
          and: false,
        });

        oEvent.getSource().getBinding("items").filter([oFilter]);
      },

      onValueHelpClose: function (oEvent) {
        this.oSelectedItem = oEvent.getParameter("selectedItem");
        this.selectedObject = this.oSelectedItem
          .getBindingContext()
          .getObject();
        oEvent.getSource().getBinding("items").filter([]);

        if (!this.oSelectedItem) {
          return;
        }

        var that = this;
        this.oTable.getItems().forEach(function (item) {
          if (item.sId === that.idItem) {
            var itemData =
              item.oBindingContexts.servicesAndProducts.getObject();

            itemData.Serviceproductid = that.selectedObject.Id;
            itemData.Description = that.selectedObject.Description;
            itemData.Category = that.selectedObject.Category;
            itemData.Unit = that.selectedObject.Unit;
            itemData.Value = that.selectedObject.Value;
            itemData.Total = itemData.Quantity * itemData.Value;
            that.jModel.refresh();
          }
        });
      },

      onMessagePopoverPress: function (oEvent) {
        var oSourceControl = oEvent.getSource();
        this._getMessagePopover().then(function (oMessagePopover) {
          oMessagePopover.openBy(oSourceControl);
        });
      },

      _getMessagePopover: function () {
        var oView = this.getView();

        // create popover lazily (singleton)
        if (!this._pMessagePopover) {
          this._pMessagePopover = Fragment.load({
            id: oView.getId(),
            name: "petshop.zppetshoporders.view.MessagePopover",
          }).then(function (oMessagePopover) {
            oView.addDependent(oMessagePopover);
            return oMessagePopover;
          });
        }
        return this._pMessagePopover;
      },

      onClearMessages: function () {
        this.getModel("objectView").setProperty(
          "/messageIcon",
          "sap-icon://message-success"
        );

        sap.ui.getCore().getMessageManager().removeAllMessages();
        if (this.editMode === false) {
          this.getModel("objectView").setProperty("/showFooter", false);
        }
      },
    });
  }
);
