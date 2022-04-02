sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel", "sap/m/PDFViewer"],
  function (BaseController, JSONModel, PDFViewer) {
    "use strict";

    return BaseController.extend(
      "petshop.zppetshoporders.controller.PdfOrder",
      {
        onInit: function () {
          var oViewModel = new JSONModel({
            busy: true,
            delay: 0,
            Source: "",
            Title: "My Custom Title",
            Height: "1000px",
          });

          this.setModel(oViewModel, "modelPdfView");

          this.getRouter()
            .getRoute("pdfView")
            .attachPatternMatched(this._onObjectMatched, this);

        },

        _onObjectMatched: function (oEvent) {
          this.sOrderId = oEvent.getParameter("arguments").orderId;
          this._bindView("/OrderHeadersReportSet" + this.sOrderId);
        },

        _bindView: function (sObjectPath) {
          var oViewModel = this.getModel("modelPdfView");

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
            oViewModel = this.getModel("modelPdfView");
          // oElementBinding = oView.getElementBinding();

          // No data for the binding
          //   if (!oElementBinding.getBoundContext()) {
          //     this.getRouter().getTargets().display("objectNotFound");
          //     return;
          //   }

          //   var oResourceBundle = this.getResourceBundle(),
          //     oOrder = oView.getBindingContext().getObject(),
          //     sOrderId = oOrder.Id,
          //     sOrderName = oOrder.Name;

          oViewModel.setProperty("/busy", false);

          var sServiceURL = this.getView().getModel().sServiceUrl;
          var sRead =
            "/PdfOrderSet(OrderId='" + this.sOrderId + "',Filename='Teste',GetPdf='X')" + "/$value";
        //   var sServiceURL = "/sap/opu/odata/sap/ZP_ZL_PET_SHOP_SRV";
          var sSource = sServiceURL + sRead;
          oViewModel.setProperty("/Source", sSource);
          oViewModel.setProperty("/Height", "800px");
        },
      }
    );
  }
);
