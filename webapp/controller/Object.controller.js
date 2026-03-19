sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ttl/edocumentcockpit/utils/formatter"
], (Controller, formatter) => {
    "use strict";

    return Controller.extend("sap.ttl.edocumentcockpit.controller.Object", {
        formatter: formatter,
        onInit: function () {
            let oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteObject").attachPatternMatched(this._onRouteMatched, this);
        },
        _onRouteMatched: function () {

            const oFilterModel = this.getOwnerComponent().getModel("FilterModel");

            if (!oFilterModel) {
                this.onNavBack();
                return;
            }

            // View Model
            const oViewModel = new sap.ui.model.json.JSONModel({
                showEway: false,
                showEwayCancel: false,
                showEinvoice: false,
                showEinvoiceCancel: false,
                showJson: false,
                showBoth: false,
                enableEdit: false,
                showTransport: false
            });

            this.getView().setModel(oViewModel, "viewModel");

            this.getView().setModel(new sap.ui.model.json.JSONModel({}), "editModel");

            const oSmartTable = this.byId("idBillingTable");

            // Ensure metadata loaded before binding
            const oModel = this.getOwnerComponent().getModel();

            oModel.metadataLoaded().then(() => {

                if (oSmartTable.isInitialised()) {
                    oSmartTable.rebindTable();
                } else {

                    oSmartTable.attachInitialise(function () {
                        oSmartTable.rebindTable();
                    });

                }

            });

        },
        onSmartTableInit: function () {

            let oSmartTable = this.byId("idBillingTable");
            let oTable = oSmartTable.getTable();
            let that = this;

            oTable.attachEventOnce("rowsUpdated", function () {

                let aColumns = oTable.getColumns();

                aColumns.forEach(function (oColumn) {

                    let sLabel = oColumn.data("p13nData")?.columnKey;
                    if (sLabel === "EdocOverallStatus") {
                        oColumn.setWidth("10rem");   // set column width
                        oColumn.setTemplate(new sap.m.ObjectStatus({
                            text: "{EdocOverallStatus}",
                            icon: {
                                path: "EdocOverallStatus",
                                formatter: that.formatter.statusIcon
                            },
                            state: {
                                path: "EdocOverallStatus",
                                formatter: that.formatter.formatStatusState
                            }
                        }));

                    }
                    if (sLabel === "Edocstatus") {
                        oColumn.setWidth("10rem");   // set column width
                        oColumn.setTemplate(new sap.m.ObjectStatus({
                            text: "{Edocstatus}",
                            // icon: {
                            //     path: "Edocstatus",
                            //     formatter: that.formatter.statusIcon
                            // },
                            state: {
                                path: "Edocstatus",
                                formatter: that.formatter.formatStatusState
                            }
                        }));

                    }
                    if (sLabel === "Errormessage") {

                        oColumn.setWidth("15rem");

                        oColumn.setTemplate(new sap.m.Link({
                            text: {
                                path: "Errormessage",
                                formatter: function (sMsg) {
                                    if (!sMsg) return "";
                                    return sMsg.length > 30 ? sMsg.substring(0, 30) + "..." : sMsg;
                                }
                            },
                            tooltip: "{Errormessage}",
                            press: function (oEvent) {

                                let sFullMessage = oEvent.getSource()
                                    .getBindingContext()
                                    .getProperty("Errormessage");

                                new sap.m.Dialog({
                                    title: "Error Message",
                                    contentWidth: "500px",
                                    content: new sap.m.Text({
                                        text: " " + sFullMessage,
                                        wrapping: true
                                    }).addStyleClass("sapUiTinyMargin"),
                                    beginButton: new sap.m.Button({
                                        text: "Close",
                                        press: function (oDialogEvent) {
                                            oDialogEvent.getSource().getParent().close();
                                        }
                                    })
                                }).open();
                            }
                        }));

                    }
                    if (sLabel === "Signedqrcode") {

                        oColumn.setWidth("15rem");

                        oColumn.setTemplate(new sap.m.Link({
                            text: {
                                path: "Signedqrcode",
                                formatter: function (sMsg) {
                                    if (!sMsg) return "";
                                    return sMsg.length > 30 ? sMsg.substring(0, 30) + "..." : sMsg;
                                }
                            },
                            tooltip: "{Signedqrcode}",
                            press: function (oEvent) {

                                let sFullMessage = oEvent.getSource()
                                    .getBindingContext()
                                    .getProperty("Signedqrcode");

                                new sap.m.Dialog({
                                    title: "Signedqrcode Message",
                                    contentWidth: "500px",
                                    content: new sap.m.Text({
                                        text: " " + sFullMessage,
                                        wrapping: true
                                    }).addStyleClass("sapUiTinyMargin"),
                                    beginButton: new sap.m.Button({
                                        text: "Close",
                                        press: function (oDialogEvent) {
                                            oDialogEvent.getSource().getParent().close();
                                        }
                                    })
                                }).open();
                            }
                        }));

                    }
                    if (sLabel === "Signedinvoice") {

                        oColumn.setWidth("10rem");

                        oColumn.setTemplate(new sap.m.Link({
                            text: "Preview",
                            press: function (oEvent) {

                                let sPath = sLabel; // Signedinvoice or Signedqrcode

                                let sBase64 = oEvent.getSource()
                                    .getBindingContext()
                                    .getProperty(sPath);

                                if (!sBase64) {
                                    sap.m.MessageToast.show("No image available");
                                    return;
                                }

                                let sSrc = "data:image/png;base64," + sBase64;

                                let oDialog = new sap.m.Dialog({
                                    title: "Image Preview",
                                    contentWidth: "600px",
                                    contentHeight: "400px",
                                    content: new sap.m.Image({
                                        src: sSrc,
                                        width: "100%",
                                        height: "100%"
                                    }),
                                    beginButton: new sap.m.Button({
                                        text: "Close",
                                        press: function () {
                                            oDialog.close();
                                        }
                                    }),
                                    afterClose: function () {
                                        oDialog.destroy();
                                    }
                                });

                                oDialog.open();
                            }
                        }));
                    }

                });

            });

        },
        onBeforeRebindTable: function (oEvent) {

            const oBindingParams = oEvent.getParameter("bindingParams");

            const oFilterModel = this.getOwnerComponent().getModel("FilterModel");

            if (!oFilterModel) {
                return;
            }

            const aFilters = oFilterModel.getProperty("/filters") || [];
            const sDivisionType = oFilterModel.getProperty("/DivisionType");
            const sBillingType = oFilterModel.getProperty("/BillingType");
            const sStausType = oFilterModel.getProperty("/DocStatus");

            if (aFilters.length) {
                oBindingParams.filters = oBindingParams.filters.concat(aFilters);
            }

            this._applyButtonVisibility(sBillingType, sDivisionType, sStausType);
        },
        /**
         * for multi select table
         * @returns 
         */
        onRowSelectionChange: function (oEvent) {

            let oTable = oEvent.getSource();
            let aSelectedIndices = oTable.getSelectedIndices();

            let bDisable = true;

            aSelectedIndices.forEach((iIndex) => {
                const oContext = oTable.getContextByIndex(iIndex);
                const oData = oContext.getObject();

                if (!oData.Invrefnumber) {
                    bDisable = false;
                }
            });

            const oViewModel = this.getView().getModel("viewModel");

            // Enable edit if at least one row selected
            oViewModel.setProperty("/enableEdit", aSelectedIndices.length > 0);

            // Disable if ANY row has empty Invrefnumber
            oViewModel.setProperty("/disableIrn", bDisable);
        },
        /**
         * for multi select table
         * @returns 
         */
        onEdit: function () {

            let oSmartTable = this.byId("idBillingTable");
            let oTable = oSmartTable.getTable();
            let aSelectedIndices = oTable.getSelectedIndices();

            if (aSelectedIndices.length === 0) {
                sap.m.MessageToast.show("Select atleast one Row");
                return;
            }

            let oContext = oTable.getContextByIndex(aSelectedIndices[0]);
            let oData = oContext.getObject();

            this.getView().getModel("editModel").setData(oData);

            if (!this._editDialog) {

                this._editDialog = sap.ui.xmlfragment(
                    this.getView().getId(),
                    "sap.ttl.edocumentcockpit.fragments.EditEwayDialog",
                    this
                );

                this.getView().addDependent(this._editDialog);

                this._editDialog.setModel(this.getView().getModel("editModel"), "editModel");
                this._editDialog.setModel(this.getView().getModel("viewModel"), "viewModel");

                this._editDialog.bindElement({
                    path: "/",
                    model: "editModel"
                });
            }

            // 🔹 Access Select inside fragment
            let oSelect = sap.ui.core.Fragment.byId(
                this.getView().getId(),
                "idSelectAction"
            );

            if (oSelect) {
                oSelect.setSelectedKey("");

                this.onEditActionChange({
                    getSource: () => oSelect
                });
            }

            this._editDialog.open();
        },

        /**
         * for single select table
         * @returns 
         */
        // onRowSelectionChange: function (oEvent) {

        //     let oTable = oEvent.getSource();
        //     let iSelectedIndex = oTable.getSelectedIndex();

        //     this.getView()
        //         .getModel("viewModel")
        //         .setProperty("/enableEdit", iSelectedIndex !== -1);

        // },
        // onEdit: function () {

        //     let oSmartTable = this.byId("idBillingTable");
        //     let oTable = oSmartTable.getTable();
        //     let iSelectedIndex = oTable.getSelectedIndex();

        //     // no row selected
        //     if (iSelectedIndex === -1) {
        //         sap.m.MessageToast.show("Select atleast one Row");
        //         return;
        //     }

        //     // get selected row data
        //     let oContext = oTable.getContextByIndex(iSelectedIndex);
        //     let oData = oContext.getObject();

        //     this.getView().getModel("editModel").setData(oData);

        //     // create dialog once
        //     if (!this._editDialog) {

        //         this._editDialog = sap.ui.xmlfragment(
        //             this.getView().getId(),
        //             "sap.ttl.edocumentcockpit.fragments.EditEwayDialog",
        //             this
        //         );

        //         this.getView().addDependent(this._editDialog);

        //         this._editDialog.setModel(this.getView().getModel("editModel"), "editModel");
        //         this._editDialog.setModel(this.getView().getModel("viewModel"), "viewModel");

        //         this._editDialog.bindElement({
        //             path: "/",
        //             model: "editModel"
        //         });
        //     }

        //     // reset action select
        //     let oSelect = sap.ui.core.Fragment.byId(
        //         this.getView().getId(),
        //         "idSelectAction"
        //     );

        //     if (oSelect) {
        //         oSelect.setSelectedKey("");

        //         this.onEditActionChange({
        //             getSource: () => oSelect
        //         });
        //     }

        //     this._editDialog.open();
        // },
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteMain");
        },
        _applyButtonVisibility: function (sBillingType, sDivision, sDocStatus) {

            let oVM = this.getView().getModel("viewModel");

            // reset all
            oVM.setProperty("/showEway", false);
            oVM.setProperty("/showEwayCancel", false);
            oVM.setProperty("/showEinvoice", false);
            oVM.setProperty("/showEinvoiceCancel", false);
            oVM.setProperty("/showJson", false);
            oVM.setProperty("/showBoth", false);

            // -------------------------
            // Status Handling
            // -------------------------

            // CANCELLED → show nothing
            if (sDocStatus === "CANCELLED") {
                return;
            }

            // FAILED → show all buttons
            if (sDocStatus === "FAILED") {
                oVM.setProperty("/showEway", true);
                oVM.setProperty("/showEwayCancel", true);
                oVM.setProperty("/showEinvoice", true);
                oVM.setProperty("/showEinvoiceCancel", true);
                return;
            }

            // determine target properties based on status
            let sEwayProp = sDocStatus === "COMPLETED" ? "/showEwayCancel" : "/showEway";
            let sEinvoiceProp = sDocStatus === "COMPLETED" ? "/showEinvoiceCancel" : "/showEinvoice";

            // -------------------------
            // E-Way only
            // -------------------------
            if (["JSN", "JDC", "F5", "F8"].includes(sBillingType)) {
                oVM.setProperty(sEwayProp, true);
            }

            // -------------------------
            // E-Invoice only
            // -------------------------
            else if (["L2", "G2"].includes(sBillingType)) {
                oVM.setProperty(sEinvoiceProp, true);
                oVM.setProperty("/showJson", true);
            }

            // -------------------------
            // F2 condition
            // -------------------------
            else if (sBillingType === "F2") {

                if (sDivision === "SR") {
                    oVM.setProperty(sEinvoiceProp, true);
                } else {
                    oVM.setProperty(sEinvoiceProp, true);
                    oVM.setProperty(sEwayProp, true);
                }

            }

            // -------------------------
            // Both
            // -------------------------
            else if (["CBRE", "JSTO", "CBST"].includes(sBillingType)) {
                oVM.setProperty(sEinvoiceProp, true);
                oVM.setProperty(sEwayProp, true);
            }
        },

        onEditActionChange: function (oEvent) {

            let key = oEvent.getSource().getSelectedKey();
            let oModel = this.getView().getModel("viewModel");

            if (key === "1") {
                oModel.setProperty("/showTransport", true);
            } else {
                oModel.setProperty("/showTransport", false);
            }

        },
        onCancelDialog: function () {
            if (this._editDialog) {
                this._editDialog.close()
            }
        },
        /**
         * for multi select table
         * @returns 
         */
        onSaveTransport: function () {

            const oTable = this.byId("idBillingTable").getTable();
            const aSelectedIndices = oTable.getSelectedIndices();

            if (!aSelectedIndices.length) {
                sap.m.MessageToast.show("Select at least one row");
                return;
            }

            const oTransportData = this.getView().getModel("editModel").getData();
            const oModel = this.getView().getModel();

            const aUpdatedItems = [];

            aSelectedIndices.forEach(function (iIndex) {

                const oContext = oTable.getContextByIndex(iIndex);
                const sPath = oContext.getPath();
                const oObject = oContext.getObject();

                // Update UI model temporarily
                oModel.setProperty(sPath + "/Transporterid", oTransportData.Transporterid);
                oModel.setProperty(sPath + "/Transdocno", oTransportData.Transdocno);
                oModel.setProperty(sPath + "/Transdocdate", oTransportData.Transdocdate);
                oModel.setProperty(sPath + "/Transportmode", oTransportData.Transportmode);
                oModel.setProperty(sPath + "/Vehicletype", oTransportData.Vehicletype);
                oModel.setProperty(sPath + "/Transdistance", oTransportData.Transdistance);
                oModel.setProperty(sPath + "/Vehicleno", oTransportData.Vehicleno);

                let oItem = Object.assign({}, oObject);

                oItem.TransporterType = oTransportData.TransporterType;
                oItem.Transporterid = oTransportData.Transporterid;
                oItem.Transdocno = oTransportData.Transdocno;
                oItem.Transdocdate = oTransportData.Transdocdate;
                oItem.Transportmode = oTransportData.Transportmode;
                oItem.Vehicletype = oTransportData.Vehicletype;
                oItem.Transdistance = oTransportData.Transdistance;
                oItem.Vehicleno = oTransportData.Vehicleno;

                aUpdatedItems.push(oItem);

            });

            this.getView().getModel("viewModel").setProperty("/transportPayload", aUpdatedItems);

            sap.m.MessageToast.show("Transport details applied to selected items");

            this._editDialog.close();

        },
        /**
                 * for single select table
                 * @returns 
                 */
        // onSaveTransport: function () {

        //     const oTable = this.byId("idBillingTable").getTable();
        //     const iSelectedIndex = oTable.getSelectedIndex();

        //     if (iSelectedIndex === -1) {
        //         sap.m.MessageToast.show("Select at least one row");
        //         return;
        //     }

        //     const oTransportData = this.getView().getModel("editModel").getData();
        //     const oModel = this.getView().getModel();

        //     const oContext = oTable.getContextByIndex(iSelectedIndex);
        //     const sPath = oContext.getPath();
        //     const oObject = oContext.getObject();

        //     // Update UI model temporarily
        //     oModel.setProperty(sPath + "/Transporterid", oTransportData.Transporterid);
        //     oModel.setProperty(sPath + "/Transdocno", oTransportData.Transdocno);
        //     oModel.setProperty(sPath + "/Transdocdate", oTransportData.Transdocdate);
        //     oModel.setProperty(sPath + "/Transportmode", oTransportData.Transportmode);
        //     oModel.setProperty(sPath + "/Vehicletype", oTransportData.Vehicletype);
        //     oModel.setProperty(sPath + "/Transdistance", oTransportData.Transdistance);
        //     oModel.setProperty(sPath + "/Vehicleno", oTransportData.Vehicleno);

        //     let oItem = Object.assign({}, oObject);

        //     oItem.TransporterType = oTransportData.TransporterType;
        //     oItem.Transporterid = oTransportData.Transporterid;
        //     oItem.Transdocno = oTransportData.Transdocno;
        //     oItem.Transdocdate = oTransportData.Transdocdate;
        //     oItem.Transportmode = oTransportData.Transportmode;
        //     oItem.Vehicletype = oTransportData.Vehicletype;
        //     oItem.Transdistance = oTransportData.Transdistance;
        //     oItem.Vehicleno = oTransportData.Vehicleno;

        //     // store payload
        //     this.getView()
        //         .getModel("viewModel")
        //         .setProperty("/transportPayload", [oItem]);

        //     sap.m.MessageToast.show("Transport details applied");

        //     this._editDialog.close();
        // },
        /**
         * for case of multiselect table
         * @returns 
         */
        _getSelectedItemsPayload: function () {

            const oTable = this.byId("idBillingTable").getTable();
            const aSelectedIndices = oTable.getSelectedIndices();

            if (!aSelectedIndices.length) {
                return [];
            }

            const oEditModel = this.getView().getModel("editModel");
            const oTransportData = oEditModel ? oEditModel.getData() : null;

            const aItems = [];

            aSelectedIndices.forEach((iIndex) => {

                const oContext = oTable.getContextByIndex(iIndex);
                const oObject = Object.assign({}, oContext.getObject());

                // if transport details exist in editModel use them
                if (oTransportData) {

                    oObject.TransporterType = oTransportData.TransporterType || oObject.TransporterType;
                    oObject.Transporterid = oTransportData.Transporterid || oObject.Transporterid;
                    oObject.Transdocno = oTransportData.Transdocno || oObject.Transdocno;
                    oObject.Transdocdate = oTransportData.Transdocdate || oObject.Transdocdate;
                    oObject.Transportmode = oTransportData.Transportmode || oObject.Transportmode;
                    oObject.Vehicletype = oTransportData.Vehicletype || oObject.Vehicletype;
                    oObject.Transdistance = oTransportData.Transdistance || oObject.Transdistance;
                    oObject.Vehicleno = oTransportData.Vehicleno || oObject.Vehicleno;

                }

                aItems.push(oObject);

            });

            return aItems;
        },

        /**
         * for single select table
         * @returns 
         */
        // _getSelectedItemsPayload: function () {

        //     const oTable = this.byId("idBillingTable").getTable();
        //     const iSelectedIndex = oTable.getSelectedIndex();

        //     if (iSelectedIndex === -1) {
        //         return [];
        //     }

        //     const oEditModel = this.getView().getModel("editModel");
        //     const oTransportData = oEditModel ? oEditModel.getData() : null;

        //     const oContext = oTable.getContextByIndex(iSelectedIndex);
        //     const oObject = Object.assign({}, oContext.getObject());

        //     // if transport details exist in editModel use them
        //     if (oTransportData) {

        //         oObject.TransporterType = oTransportData.TransporterType || oObject.TransporterType;
        //         oObject.Transporterid = oTransportData.Transporterid || oObject.Transporterid;
        //         oObject.Transdocno = oTransportData.Transdocno || oObject.Transdocno;
        //         oObject.Transdocdate = oTransportData.Transdocdate || oObject.Transdocdate;
        //         oObject.Transportmode = oTransportData.Transportmode || oObject.Transportmode;
        //         oObject.Vehicletype = oTransportData.Vehicletype || oObject.Vehicletype;
        //         oObject.Transdistance = oTransportData.Transdistance || oObject.Transdistance;
        //         oObject.Vehicleno = oTransportData.Vehicleno || oObject.Vehicleno;

        //     }

        //     return [oObject]; // keep array for service payload compatibility
        // },

        onEinvoicePress: function () {

            const that = this;
            const aItems = this._getSelectedItemsPayload();

            if (!aItems.length) {
                sap.m.MessageToast.show("No items selected");
                return;
            }
            this.getView().setBusy(true);

            const oPayload = {
                action: "GEN_EINVOICE",
                items: aItems
            };

            console.log("Payload:", oPayload);

            $.ajax({
                url: "/sap/bc/http/sap/ZCL_EDOC_HANDLER_SERV?sap-client=080",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(oPayload),

                success: function (oResponse) {
                    that.getView().setBusy(false);
                    that._handleServiceResponse(oResponse);
                    that.byId("idBillingTable").rebindTable();
                },

                error: function () {
                    that.getView().setBusy(false);
                    sap.m.MessageBox.error("Service call failed");
                    that.byId("idBillingTable").rebindTable();
                }

            });

        },
        onEwayBillPress: function () {

            const that = this;

            const aItems = this._getSelectedItemsPayload();

            if (!aItems.length) {
                sap.m.MessageToast.show("No items selected");
                return;
            }
            this.getView().setBusy(true);
            const oPayload = {
                action: "GEN_EWAY",
                items: aItems
            };

            console.log("Payload:", oPayload);

            $.ajax({
                url: "/sap/bc/http/sap/ZCL_EDOC_HANDLER_SERV?sap-client=080",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(oPayload),

                success: function (oResponse) {
                    that.getView().setBusy(false);
                    that._handleServiceResponse(oResponse);
                    that.byId("idBillingTable").rebindTable();
                },

                error: function () {
                    that.getView().setBusy(false);
                    sap.m.MessageBox.error("Service call failed");
                    that.byId("idBillingTable").rebindTable();
                }

            });

        },
        onEinvoicePressCancel: function () {

            const aItems = this._getSelectedItemsPayload();

            if (!aItems.length) {
                sap.m.MessageToast.show("No items selected");
                return;
            }

            if (!this._cancelDialog) {

                this._cancelDialog = sap.ui.xmlfragment(
                    this.getView().getId(),
                    "sap.ttl.edocumentcockpit.fragments.EinvoiceCancelDialog",
                    this
                );

                this.getView().addDependent(this._cancelDialog);
            }

            this._cancelDialog.open();
        },
        onEwayBillCancel: function () {

            const aItems = this._getSelectedItemsPayload();

            if (!aItems.length) {
                sap.m.MessageToast.show("No items selected");
                return;
            }
            this.getView().setBusy(true);
            if (!this._ewaycancelDialog) {

                this._ewaycancelDialog = sap.ui.xmlfragment(
                    this.getView().getId(),
                    "sap.ttl.edocumentcockpit.fragments.EwayCancelDialog",
                    this
                );

                this.getView().addDependent(this._ewaycancelDialog);
            }

            this._ewaycancelDialog.open();
        },
        onCloseCancelDialog: function () {

            if (this._cancelDialog) {
                this._cancelDialog.close();
            }
            if (this._ewaycancelDialog) {
                this._ewaycancelDialog.close();
            }


        },
        onConfirmEinvoiceCancel: function () {

            const that = this;

            const aItems = this._getSelectedItemsPayload();

            if (!aItems.length) {
                sap.m.MessageToast.show("No items selected");
                return;
            }

            const oReasonSelect = sap.ui.core.Fragment.byId(
                this.getView().getId(),
                "idCancelReason"
            );

            // const oRemarkInput = sap.ui.core.Fragment.byId(
            //     this.getView().getId(),
            //     "idCancelRemark"
            // );

            const sReason = oReasonSelect.getSelectedKey();
            // const sRemark = oRemarkInput.getValue();
            const sRemark = oReasonSelect.getSelectedItem().getText();

            if (!sReason) {
                sap.m.MessageToast.show("Select Cancel Reason");
                return;
            }
            this.getView().setBusy(true);
            const oPayload = {
                action: "CANCEL_EINVOICE",
                items: aItems.map(function (o) {

                    return {
                        billingdocument: o.BillingDocument,
                        irn: o.Invrefnumber,
                        reason: sReason,
                        remarks: sRemark
                    };
                })
            };

            console.log("Cancel Payload:", oPayload);

            $.ajax({
                url: "/sap/bc/http/sap/ZCL_EDOC_HANDLER_SERV?sap-client=080",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(oPayload),

                success: function (oResponse) {
                    that.getView().setBusy(false);
                    that._handleServiceResponse(oResponse);
                    that.byId("idBillingTable").rebindTable();

                    that._cancelDialog.close();
                },

                error: function () {
                    that.getView().setBusy(false);
                    sap.m.MessageBox.error("Service call failed");

                    that.byId("idBillingTable").rebindTable();
                }
            });

        },
        onConfirmEwayCancel: function () {

            const that = this;

            const aItems = this._getSelectedItemsPayload();

            if (!aItems.length) {
                sap.m.MessageToast.show("No items selected");
                return;
            }

            const oReasonSelect = sap.ui.core.Fragment.byId(
                this.getView().getId(),
                "idEwayCancelReason"
            );

            // const oRemarkInput = sap.ui.core.Fragment.byId(
            //     this.getView().getId(),
            //     "idCancelRemark"
            // );

            const sReason = oReasonSelect.getSelectedKey();
            // const sRemark = oRemarkInput.getValue();
            const sRemark = oReasonSelect.getSelectedItem().getText();

            if (!sReason) {
                sap.m.MessageToast.show("Select Cancel Reason");
                return;
            }
            this.getView().setBusy(true);
            const oPayload = {
                action: "CANCEL_EWAY",
                items: aItems.map(function (o) {
                    return {
                        billingdocument: o.BillingDocument,
                        irn: o.Invrefnumber,
                        reason: sReason,
                        remarks: sRemark
                    };
                })
            };

            console.log("Cancel Payload:", oPayload);

            $.ajax({
                url: "/sap/bc/http/sap/ZCL_EDOC_HANDLER_SERV?sap-client=080",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(oPayload),

                success: function (oResponse) {
                    that.getView().setBusy(false);
                    that._handleServiceResponse(oResponse);
                    that.byId("idBillingTable").rebindTable();
                    that._cancelDialog.close();
                },

                error: function () {
                    that.getView().setBusy(false);
                    sap.m.MessageBox.error("Service call failed");
                    that.byId("idBillingTable").rebindTable();
                }
            });

        },
        _handleServiceResponse: function (sResponse) {

            // Extract values
            var iSuccess = (sResponse.match(/Success:\s*(\d+)/) || [])[1] || "0";
            var sSuccessDocs = (sResponse.match(/Success Docs:\s*(.*?)\s*Failed:/) || [])[1] || "";

            var iFailed = (sResponse.match(/Failed:\s*(\d+)/) || [])[1] || "0";
            var sFailedDocs = (sResponse.match(/Failed Docs:\s*(.*?)\s*Error Message:/) || [])[1] || "";

            var sErrorMessage = (sResponse.match(/Error Message:\s*(.*)/) || [])[1] || "";

            // Build formatted message
            var sFormattedMsg =
                "Success : " + iSuccess + "\n";

            if (sSuccessDocs) {
                sFormattedMsg += "Success Docs :\n" + sSuccessDocs.trim() + "\n\n";
            }

            sFormattedMsg +=
                "Failed : " + iFailed + "\n";

            if (sFailedDocs) {
                sFormattedMsg += "Failed Docs :\n" + sFailedDocs.trim() + "\n\n";
            }

            if (sErrorMessage) {

                // Make each error message appear on new line
                var aErrors = sErrorMessage.split(",");
                var sErrorsFormatted = aErrors.map(function (e) {
                    return "• " + e.trim();
                }).join("\n");

                sFormattedMsg += "Error Message :\n" + sErrorsFormatted;
            }

            var fnBox = iFailed > 0 ? sap.m.MessageBox.error : sap.m.MessageBox.success;

            fnBox(sFormattedMsg, {
                title: "Result",
                actions: [sap.m.MessageBox.Action.OK]
            });
        }

    });
});