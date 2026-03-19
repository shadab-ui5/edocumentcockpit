sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog"
], (Controller, ValueHelpDialog) => {
    "use strict";

    return Controller.extend("sap.ttl.edocumentcockpit.controller.Main", {

        onInit: function () {
            var oBillingTypeModel = new sap.ui.model.json.JSONModel({
                BillingTypes: [
                    { key: "G2", text: "G2 - Credit Memo" },
                    { key: "CBRE", text: "CBRE - Credit Memo for Returns" },
                    { key: "L2", text: "L2 - Debit Memo" },
                    { key: "F2", text: "F2 - Invoice" },

                    { key: "JSTO", text: "JSTO - IN: STO billing" },
                    { key: "JDC", text: "JDC - IN: Intrastate Delivery Challan" },
                    { key: "JSN", text: "JSN - IN: Subcon Challan" },
                    { key: "CBST", text: "CBST - Intercompany Billing for STO" },

                    { key: "CIXS", text: "CIXS - Pro Forma for Ext. Transaction" },
                    { key: "F8", text: "F8 - Pro Forma Invoice for Delivery" }
                ],
                showBillingDocument: false
            });
            this._aFieldOrder = [
                "idEDocType",
                "idCompanyCode",
                "idSalesOrg",
                "idDistChannel",
                "idDivision",
                "idPlant",
                "idBillingType",
                "customerSmartField",
                "idBillingDoc",
                "idBillingDate",
                // "idOverallStatus",
                // "idDocStatus"
            ]
            this.getView().setModel(oBillingTypeModel, "billingModel");
            this._loadUserAuth();
            let oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteMain").attachPatternMatched(this._onRouteMatched, this);
        },
        _onRouteMatched: function () {
            this.getView().byId("idFormContainer").setBusy(false);
        },
        onOverallChange: function (oEvent) {
            let sKey = oEvent.getSource().getSelectedKey();
            let oViewModel = this.getView().getModel("billingModel");

            // Example condition
            if (sKey === "COMPLETED" || sKey === "FAILED") {
                oViewModel.setProperty("/showBillingDocument", true);
            } else {
                oViewModel.setProperty("/showBillingDocument", false);
            }
        },
        _resetFieldsAfter: function (sFieldId) {

            var oView = this.getView();
            var aFields = this._aFieldOrder;

            var iIndex = aFields.indexOf(sFieldId);

            for (var i = iIndex + 1; i < aFields.length; i++) {

                var oControl = oView.byId(aFields[i]);

                if (!oControl) continue;

                if (oControl.setSelectedKey) {
                    oControl.setSelectedKey("");
                }

                if (oControl.removeAllSelectedItems) {
                    oControl.removeAllSelectedItems();
                }

                if (oControl.removeAllTokens) {
                    oControl.removeAllTokens();
                }

                if (oControl.setValue) {
                    oControl.setValue("");
                }

                if (oControl.setDateValue) {
                    oControl.setDateValue(null);
                    oControl.setSecondDateValue(null);
                }
            }
        },
        onEDocTypeChange: function (oEvent) {

            this._resetFieldsAfter("idEDocType");

            // load company codes if required
        },
        onBillingTypeChange: function (oEvent) {

            this._resetFieldsAfter("idBillingType");

            // load company codes if required
        },
        onCompanyChange: function () {

            this._resetFieldsAfter("idCompanyCode");

        },
        onSalesOrgChange: function () {

            this._resetFieldsAfter("idSalesOrg");

        },

        onDivisionChange: function (oEvent) {
            var oControl = oEvent.getSource();
            var aKeys = oControl.getSelectedKeys();

            // If SR and other values both exist
            if (aKeys.includes("SR") && aKeys.length > 1) {

                // If SR was selected first → keep SR only
                if (aKeys[0] === "SR") {
                    oControl.setSelectedKeys(["SR"]);
                    sap.m.MessageToast.show("SR cannot be selected with other divisions");
                }
                // If other values were selected first → remove SR
                else {
                    oControl.setSelectedKeys(aKeys.filter(function (key) {
                        return key !== "SR";
                    }));
                    sap.m.MessageToast.show("SR cannot be selected when other divisions are selected");
                }
            }

            this._resetFieldsAfter("idDivision");

        },
        onDistChange: function () {

            this._resetFieldsAfter("idDistChannel");

        },
        onPlantChange: function () {

            this._resetFieldsAfter("idPlant");

        },
        _loadUserAuth: function () {

            var oModel = this.getOwnerComponent().getModel();
            const sUser = sap.ushell?.Container?.getUser()?.getId() || "CB9980000037";
            var aFilters = [
                new sap.ui.model.Filter("Userid",
                    sap.ui.model.FilterOperator.EQ,
                    sUser)
            ];

            oModel.read("/eDocAuth", {
                filters: aFilters,
                success: function (oData) {

                    this._authData = oData.results;

                    this._populateEDocType();
                    this._populateCompany();

                }.bind(this)
            });
        },
        _populateEDocType: function () {

            var oCombo = this.byId("idEDocType");

            var aUnique = [...new Set(this._authData.map(x => x.Type))];

            aUnique.forEach(function (sType) {
                oCombo.addItem(new sap.ui.core.Item({
                    key: sType,
                    text: sType
                }));
            });

            // Auto select first value
            if (aUnique.length > 0) {
                oCombo.setSelectedKey(aUnique[0]);
            }
        },
        _populateCompany: function () {

            var oCombo = this.byId("idCompanyCode");

            var aUnique = [...new Set(this._authData.map(x => x.Compcode))];

            aUnique.forEach(function (sComp) {

                var oRecord = this._authData.find(x => x.Compcode === sComp);

                oCombo.addItem(new sap.ui.core.Item({
                    key: sComp,
                    text: sComp + " - " + oRecord.Compname
                }));

            }.bind(this));

            // Auto select first company
            if (aUnique.length > 0) {

                oCombo.setSelectedKey(aUnique[0]);

                // trigger dependent filter
                this._populateSalesOrg(aUnique[0]);
            }
        }, _populateSalesOrg: function (sCompany) {

            var oSales = this.byId("idSalesOrg");
            oSales.removeAllItems();

            var aSales = this._authData.filter(x => x.Compcode === sCompany);

            var aUnique = [...new Set(aSales.map(x => x.SalesOrg))];

            aUnique.forEach(function (sSales) {

                var oRec = aSales.find(x => x.SalesOrg === sSales);

                oSales.addItem(new sap.ui.core.Item({
                    key: sSales,
                    text: sSales + " - " + oRec.Salesorgname
                }));

            });

            if (aUnique.length > 0) {

                oSales.setSelectedKey(aUnique[0]);
                this._loadSalesDependentFilters(aUnique[0]);
                this._populatePlant(aUnique[0]);
            }
        },
        _populatePlant: function (sSalesOrg) {

            var oPlant = this.byId("idPlant");
            oPlant.removeAllItems();

            var aPlants = this._authData.filter(x => x.SalesOrg === sSalesOrg);

            var aUnique = [...new Set(aPlants.map(x => x.Plant))];

            aUnique.forEach(function (sPlant) {

                var oRec = aPlants.find(x => x.Plant === sPlant);

                oPlant.addItem(new sap.ui.core.Item({
                    key: sPlant,
                    text: sPlant + " - " + oRec.Plantname
                }));

            });

            if (aUnique.length > 0) {
                oPlant.setSelectedKeys(aUnique[0]);
            }
        },
        onCompanyChange: function (oEvent) {

            var sCompany = oEvent.getSource().getSelectedKey();

            this._populateSalesOrg(sCompany);
        },
        _getUniqueValues: function (arr, field) {
            return [...new Set(arr.map(item => item[field]))];
        },
        onSalesOrgChange: function (oEvent) {

            var sSalesOrg = oEvent.getSource().getSelectedKey();
            this._populatePlant(sSalesOrg);
            var oDist = this.byId("idDistChannel");
            var oDiv = this.byId("idDivision");

            var oDistBinding = oDist.getBinding("items");
            var oDivBinding = oDiv.getBinding("items");

            var aFilters = [
                new sap.ui.model.Filter(
                    "SalesOrganization",
                    sap.ui.model.FilterOperator.EQ,
                    sSalesOrg
                )
            ];

            oDistBinding.filter(aFilters);
            oDivBinding.filter(aFilters);
            this.byId("customerSmartField").setValue("");
        },
        _loadSalesDependentFilters: function (sSalesOrg) {

            var aFilters = [
                new sap.ui.model.Filter(
                    "SalesOrganization",
                    sap.ui.model.FilterOperator.EQ,
                    sSalesOrg
                )
            ];

            var oDist = this.byId("idDistChannel");
            var oDiv = this.byId("idDivision");

            var oDistBinding = oDist.getBinding("items");
            var oDivBinding = oDiv.getBinding("items");

            oDistBinding.filter(aFilters);
            oDivBinding.filter(aFilters);

            // Select first Distribution Channel automatically
            oDistBinding.attachEventOnce("dataReceived", function () {

                var aItems = oDist.getItems();

                if (aItems.length > 0) {
                    var aKeys = aItems.map(function (oItem) {
                        return oItem.getKey();
                    });

                    oDist.setSelectedKeys(aKeys);
                }

            });

            // Select first Division automatically
            oDivBinding.attachEventOnce("dataReceived", function () {

                var aItems = oDiv.getItems();

                if (aItems.length > 0) {
                    oDiv.setSelectedKeys([aItems[0].getKey()]);
                }

            });

        },
        onCustomerValueHelp: function () {
            var that = this;
            var iPageSize = 1000;
            var iSkip = 0;
            var bAllDataLoaded = false;
            var oModel = this.getView().getModel();

            // Extract filters from view
            var sSalesOrg = this.byId("idSalesOrg").getSelectedKey();
            var aDist = this.byId("idDistChannel").getSelectedKeys();
            var aDivision = this.byId("idDivision").getSelectedKeys();

            var aSelectFilters = [];
            if (sSalesOrg) aSelectFilters.push(new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, sSalesOrg));
            // if (sDivision) aSelectFilters.push(new sap.ui.model.Filter("Division", sap.ui.model.FilterOperator.EQ, sDivision));
            if (aDist.length) aSelectFilters.push(new sap.ui.model.Filter({ filters: aDist.map(d => new sap.ui.model.Filter("DistributionChannel", sap.ui.model.FilterOperator.EQ, d)), and: false }));
            if (aDivision.length) aSelectFilters.push(new sap.ui.model.Filter({ filters: aDivision.map(d => new sap.ui.model.Filter("Division", sap.ui.model.FilterOperator.EQ, d)), and: false }));

            // Define columns
            var aCols = [
                { label: "Customer", path: "Customer", width: "12rem" },
                { label: "Customer Name", path: "CustomerName", width: "12rem" },
                { label: "SalesOrganization", path: "SalesOrganization", width: "12rem" },
                { label: "DistributionChannel", path: "DistributionChannel", width: "12rem" },
                { label: "Division", path: "Division", width: "12rem" }
            ];

            // Fetch data from server
            function fetchData(skip, filters, callback) {
                if (bAllDataLoaded) return;
                oModel.read("/salesCustomer", {
                    filters: filters,
                    urlParameters: { "$top": iPageSize, "$skip": skip, "$select": "Customer,CustomerName,SalesOrganization,DistributionChannel,Division" },
                    success: function (oData) {
                        if (oData.results.length < iPageSize) bAllDataLoaded = true;
                        callback(oData.results);
                    }
                });
            }

            // Initialize ValueHelpDialog
            var oVHD = new ValueHelpDialog({
                title: "Select Customer",
                supportMultiselect: true,
                key: "Customer",
                descriptionKey: "Customer",
                ok: function (e) {
                    var oMultiInput = that.byId("customerSmartField");
                    oMultiInput.removeAllTokens();
                    var aTokens = e.getParameter("tokens");
                    aTokens.forEach(function (t) {
                        oMultiInput.addToken(new sap.m.Token({
                            key: t.getKey(),
                            text: t.getKey()
                        }));
                    });

                    // that.byId("customerSmartField").fireChange({ value: sValue, newValue: sValue, valid: true });
                    oVHD.close();
                },
                cancel: function () { oVHD.close(); },
                afterClose: function () { oVHD.destroy(); }
            });

            var oTable = oVHD.getTable();
            if (oTable.setSelectionMode) oTable.setSelectionMode("MultiToggle");


            oTable.setTitle("Customers (0)");
            var oUniqueModel = new sap.ui.model.json.JSONModel({ salesCustomer: [] });
            oTable.setModel(oUniqueModel);

            // Configure columns
            if (oTable.bindRows) { // GridTable
                aCols.forEach(c => oTable.addColumn(new sap.ui.table.Column({ label: c.label, template: new sap.m.Text({ text: "{" + c.path + "}" }), width: c.width })));
                oTable.bindRows("/salesCustomer");

                // Scroll-load for GridTable
                oTable.attachFirstVisibleRowChanged(function () {
                    var iLastVisibleRow = oTable.getFirstVisibleRow() + oTable.getVisibleRowCount();
                    var aCurrentData = oUniqueModel.getProperty("/salesCustomer");
                    if (!bAllDataLoaded && iLastVisibleRow >= aCurrentData.length) {
                        fetchData(iSkip, aSelectFilters, function (aResults) {
                            if (aResults.length) {
                                aCurrentData = aCurrentData.concat(aResults);
                                oUniqueModel.setProperty("/salesCustomer", aCurrentData);
                                iSkip += aResults.length;
                                oTable.setTitle("Customers (" + aCurrentData.length + ")");
                            }
                        });
                    }
                });
            } else { // ResponsiveTable
                aCols.forEach(c => oTable.addColumn(new sap.m.Column({ header: new sap.m.Label({ text: c.label }) })));
                oTable.bindItems({
                    path: "/salesCustomer",
                    template: new sap.m.ColumnListItem({ cells: aCols.map(c => new sap.m.Text({ text: "{" + c.path + "}" })) }),
                    templateShareable: true
                });
                oTable.setGrowing(true);
                oTable.setGrowingThreshold(iPageSize);
                oTable.setGrowingScrollToLoad(true);
            }

            // Load initial batch
            fetchData(iSkip, aSelectFilters, function (aResults) {
                oUniqueModel.setProperty("/salesCustomer", aResults);
                iSkip += aResults.length;
                var aCurrentData = oUniqueModel.getProperty("/salesCustomer");
                oTable.setTitle("Customers (" + aCurrentData.length + ")");
            });

            // Search bar
            var oBasicSearch = new sap.m.SearchField({
                width: "100%",
                search: function (oEvt) {
                    var sQuery = (oEvt.getSource().getValue() || "").trim();

                    // Reset scroll state
                    iSkip = 0;
                    bAllDataLoaded = false;

                    if (!sQuery) { // no search, load first batch
                        fetchData(iSkip, aSelectFilters, function (aResults) {
                            oUniqueModel.setProperty("/salesCustomer", aResults);
                            iSkip += aResults.length;
                        });
                        return;
                    }

                    var oSearchFilter = new sap.ui.model.Filter("Customer", sap.ui.model.FilterOperator.Contains, sQuery);
                    var oOrFilter = new sap.ui.model.Filter({ filters: [oSearchFilter], and: false });

                    // Fetch filtered data from server
                    fetchData(iSkip, aSelectFilters.concat([oOrFilter]), function (aResults) {
                        oUniqueModel.setProperty("/salesCustomer", aResults);
                        iSkip += aResults.length;
                    });
                }
            });

            var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
                advancedMode: true,
                search: function () { oBasicSearch.fireSearch(); }
            });
            oFilterBar.setBasicSearch(oBasicSearch);
            oVHD.setFilterBar(oFilterBar);

            oBasicSearch.setValue(that.byId("customerSmartField").getValue());
            oVHD.open();
        },

        onBillingValueHelp: function () {
            var that = this;
            var sCompanyCode = this.byId("idCompanyCode").getSelectedKey();
            var sSalesOrg = this.byId("idSalesOrg").getSelectedKey();
            var aDist = this.byId("idDistChannel").getSelectedKeys();
            var aDivision = this.byId("idDivision").getSelectedKeys();
            var sBillingType = this.byId("idBillingType").getSelectedKey();
            var aPlant = this.byId("idPlant").getSelectedKeys();
            var aSelectFilters = [];
            if (sCompanyCode) {
                aSelectFilters.push(
                    new sap.ui.model.Filter("CompanyCode", sap.ui.model.FilterOperator.EQ, sCompanyCode)
                );
            }
            if (aPlant.length > 0) {
                var aPlantFilters = aPlant.map(function (d) {
                    return new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, d);
                });

                aSelectFilters.push(new sap.ui.model.Filter({
                    filters: aPlantFilters,
                    and: false
                }));
            }
            // MultiInput customer tokens
            var aCustomerTokens = this.byId("customerSmartField").getTokens();
            var aCustomer = aCustomerTokens.map(function (t) {
                return t.getKey();
            });

            if (sSalesOrg) {
                aSelectFilters.push(new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, sSalesOrg));
            }

            if (aDist.length) {
                var aDistFilters = aDist.map(function (d) {
                    return new sap.ui.model.Filter("DistributionChannel", sap.ui.model.FilterOperator.EQ, d);
                });

                aSelectFilters.push(new sap.ui.model.Filter({
                    filters: aDistFilters,
                    and: false
                }));
            }

            if (aDivision.length) {
                var aDivFilters = aDivision.map(function (d) {
                    return new sap.ui.model.Filter("Division", sap.ui.model.FilterOperator.EQ, d);
                });

                aSelectFilters.push(new sap.ui.model.Filter({
                    filters: aDivFilters,
                    and: false
                }));
            }
            if (sBillingType) {
                aSelectFilters.push(new sap.ui.model.Filter("BillingType", sap.ui.model.FilterOperator.EQ, sBillingType));
            }
            // if (sDivisionType) {
            //     aSelectFilters.push(new sap.ui.model.Filter("Division", sap.ui.model.FilterOperator.EQ, sDivisionType));
            // }
            if (aCustomer.length) {
                var aCustFilters = aCustomer.map(function (c) {
                    return new sap.ui.model.Filter("Customer", sap.ui.model.FilterOperator.EQ, c);
                });

                aSelectFilters.push(new sap.ui.model.Filter({
                    filters: aCustFilters,
                    and: false
                }));
            }
            // ===================================================
            // 1. Define columns
            // ===================================================
            var aCols = [
                { label: "Billing Document", path: "BillingDocument", width: "12rem" },
                { label: "Billing Type", path: "BillingType", width: "12rem" },
                { label: "Plant", path: "Plant", width: "12rem" },
                { label: "Customer", path: "Customer", width: "12rem" },
                { label: "SalesOrganization", path: "SalesOrganization", width: "12rem" },
                { label: "DistributionChannel", path: "DistributionChannel", width: "12rem" },
                { label: "Division", path: "Division", width: "12rem" }
            ];

            // ===================================================
            // 2. First fetch data from OData → then open VHD
            // ===================================================
            var oModel = this.getView().getModel();

            oModel.read("/billingDocument", {
                filters: aSelectFilters,
                urlParameters: { "$top": 5000, "$select": "BillingDocument,Plant,BillingType,Customer,CompanyCode,SalesOrganization,DistributionChannel,Division" },
                success: function (oData) {

                    // ===============================
                    // Create unique list
                    // ===============================
                    var oUniqueMap = {};
                    var aUniqueList = [];

                    oData.results.forEach(item => {
                        var sKey = item.BillingDocument;
                        if (!oUniqueMap[sKey]) {
                            oUniqueMap[sKey] = true;
                            aUniqueList.push(item);
                        }
                    });

                    // Create JSON model for unique values
                    var oUniqueModel = new sap.ui.model.json.JSONModel({
                        billingDocument: aUniqueList
                    });

                    // ===================================================
                    // 3. Create ValueHelpDialog
                    // ===================================================
                    var oVHD = new ValueHelpDialog({
                        title: "Select Billing Document",
                        supportMultiselect: true,
                        key: "BillingDocument",
                        descriptionKey: "BillingDocument",

                        ok: function (e) {
                            var oMultiInput = that.byId("idBillingDoc");
                            oMultiInput.removeAllTokens();
                            var aTokens = e.getParameter("tokens");
                            aTokens.forEach(function (t) {
                                oMultiInput.addToken(new sap.m.Token({
                                    key: t.getKey(),
                                    text: t.getKey()
                                }));
                            });

                            // that.byId("idBillingDoc").fireChange({
                            //     value: sValue,
                            //     newValue: sValue,
                            //     valid: true
                            // });


                            // that.byId("idContract").setValue(sKey.split('-')[0]);
                            oVHD.close();
                        },

                        cancel: function () { oVHD.close(); },
                        afterClose: function () { oVHD.destroy(); }
                    });

                    // ===================================================
                    // 4. Configure Table
                    // ===================================================
                    var oTable = oVHD.getTable();

                    if (oTable.bindRows) {
                        // Grid table
                        aCols.forEach(c => oTable.addColumn(new sap.ui.table.Column({
                            label: c.label,
                            template: new sap.m.Text({
                                text: {
                                    path: c.path,
                                    formatter: function (v) {
                                        if (c.path === "PaymentRunDate" && v) {
                                            return sap.ui.core.format.DateFormat.getDateInstance({
                                                pattern: "yyyy-MM-dd"
                                            }).format(new Date(v));
                                        }
                                        return v;
                                    }
                                }
                            }),
                            width: c.width
                        })));

                        oTable.setModel(oUniqueModel);
                        oTable.bindRows("/billingDocument");

                    } else {
                        // Responsive table
                        aCols.forEach(c => oTable.addColumn(new sap.m.Column({
                            header: new sap.m.Label({ text: c.label })
                        })));

                        oTable.setModel(oUniqueModel);
                        oTable.bindItems({
                            path: "/billingDocument",
                            template: new sap.m.ColumnListItem({
                                cells: aCols.map(c => new sap.m.Text({
                                    text: {
                                        path: c.path,
                                        formatter: function (v) {
                                            if (v && c.path === "PaymentRunDate") {
                                                return sap.ui.core.format.DateFormat
                                                    .getDateInstance({ pattern: "yyyy-MM-dd" })
                                                    .format(new Date(v));
                                            }
                                            return v;
                                        }
                                    }
                                }))
                            })
                        });
                    }

                    // ===================================================
                    // 5. Search logic (client + server)
                    // ===================================================
                    var fnDoSearch = function (sQuery) {
                        sQuery = (sQuery || "").trim();

                        var sAgg = oTable.bindRows ? "rows" : "items";
                        var oBinding = oTable.getBinding(sAgg);

                        if (!sQuery) {
                            oBinding.filter([]);
                            return;
                        }

                        var aFilters = [new sap.ui.model.Filter("BillingDocument", sap.ui.model.FilterOperator.Contains, sQuery)]


                        var oOrFilter = new sap.ui.model.Filter({
                            filters: aFilters,
                            and: false
                        });

                        // client search on unique model
                        oBinding.filter([oOrFilter], "Application");

                        // If no results → do server search
                        if (oBinding.getLength() === 0) {
                            oModel.read("/billingDocument", {
                                filters: aSelectFilters.concat([oOrFilter]),
                                urlParameters: { "$top": 5000, "$select": "BillingDocument,Plant,BillingType,Customer,CompanyCode,SalesOrganization,DistributionChannel,Division" },
                                success: function (oData) {

                                    var oMap = {};
                                    var aList = [];

                                    oData.results.forEach(item => {
                                        var key = item.BillingDocument;
                                        if (!oMap[key]) {
                                            oMap[key] = true;
                                            aList.push(item);
                                        }
                                    });

                                    var oJson = new sap.ui.model.json.JSONModel({
                                        billingDocument: aList
                                    });

                                    oTable.setModel(oJson);

                                    if (oTable.bindRows) {
                                        oTable.bindRows("/billingDocument");
                                    } else {
                                        oTable.bindItems({
                                            path: "/billingDocument",
                                            template: new sap.m.ColumnListItem({
                                                cells: aCols.map(c => new sap.m.Text({ text: "{" + c.path + "}" }))
                                            })
                                        });
                                    }
                                }
                            });
                        }
                    };

                    // ===================================================
                    // 6. SearchBar setup
                    // ===================================================
                    var oBasicSearch = new sap.m.SearchField({
                        width: "100%",
                        search: function (oEvt) {
                            fnDoSearch(oEvt.getSource().getValue());
                        }
                    });

                    var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
                        advancedMode: true,
                        search: function () {
                            fnDoSearch(oBasicSearch.getValue());
                        }
                    });

                    oFilterBar.setBasicSearch(oBasicSearch);
                    oVHD.setFilterBar(oFilterBar);

                    // Prefill
                    var sPrefill = that.byId("idBillingDoc").getValue();
                    oBasicSearch.setValue(sPrefill);

                    // ===================================================
                    // 7. Open Dialog
                    // ===================================================
                    oVHD.open();
                }
            });
        },
        _validateRequiredFields: function () {

            var oView = this.getView();
            var bValid = true;

            var aRequiredFields = [
                "idEDocType",
                "idCompanyCode",
                "idSalesOrg",
                "idDistChannel",
                "idDivision",
                "idPlant",
                "idBillingType",
                // "idBillingDoc"
            ];

            aRequiredFields.forEach(function (sId) {

                var oControl = oView.byId(sId);

                var bEmpty = false;

                if (oControl.getSelectedKey && !oControl.getSelectedKey()) {
                    bEmpty = true;
                }

                if (oControl.getSelectedKeys && oControl.getSelectedKeys().length === 0) {
                    bEmpty = true;
                }

                if (oControl.getTokens && oControl.getTokens().length === 0) {
                    bEmpty = true;
                }
                if (oControl.getTokens && oControl.getTokens().length > 0) {
                    bEmpty = false;
                }

                if (bEmpty) {

                    oControl.setValueState("Error");
                    oControl.setValueStateText("Required field");

                    bValid = false;

                } else {

                    oControl.setValueState("None");

                }

            });

            return bValid;

        },
        onExecute: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var aFilters = [];
            if (!this._validateRequiredFields()) {

                sap.m.MessageToast.show("Please fill all required fields");
                return;

            }
            this.getView().byId("idFormContainer").setBusy(true);
            // -----------------------------
            // Helper functions
            // -----------------------------
            function createMultiFilter(aValues, sPath) {
                if (!aValues || !aValues.length) return null;

                var aF = aValues.map(function (v) {
                    return new sap.ui.model.Filter(sPath, sap.ui.model.FilterOperator.EQ, v);
                });

                return new sap.ui.model.Filter({
                    filters: aF,
                    and: false
                });
            }

            function getMultiComboValues(id) {
                return oView.byId(id).getSelectedKeys();
            }

            function getMultiInputValues(id) {
                var aTokens = oView.byId(id).getTokens();
                return aTokens.map(function (t) {
                    return t.getKey();
                });
            }

            // -----------------------------
            // Simple fields
            // -----------------------------
            var sEDocType = oView.byId("idEDocType").getSelectedKey();
            var sCompanyCode = oView.byId("idCompanyCode").getSelectedKey();
            var sSalesOrg = oView.byId("idSalesOrg").getSelectedKey();
            var sBillingType = oView.byId("idBillingType").getSelectedKey();
            var sDocStatus = oView.byId("idDocStatus").getSelectedKey();
            var sOverallStatus = oView.byId("idOverallStatus").getSelectedKey();

            if (sCompanyCode) {
                aFilters.push(new sap.ui.model.Filter("CompanyCode", "EQ", sCompanyCode));
            }

            if (sSalesOrg) {
                aFilters.push(new sap.ui.model.Filter("SalesOrganization", "EQ", sSalesOrg));
            }
            if (sBillingType) {
                aFilters.push(new sap.ui.model.Filter("BillingType", "EQ", sBillingType));
            }
            if (sDocStatus) {
                aFilters.push(new sap.ui.model.Filter("Edocstatus", "EQ", sDocStatus));
            }
            if (sOverallStatus) {
                aFilters.push(new sap.ui.model.Filter("EdocOverallStatus", "EQ", sOverallStatus));
            }

            // -----------------------------
            // MultiCombo fields
            // -----------------------------
            var aDist = getMultiComboValues("idDistChannel");
            var aDivision = getMultiComboValues("idDivision");
            var aPlant = getMultiComboValues("idPlant");

            var oFilter;

            oFilter = createMultiFilter(aDist, "DistributionChannel");
            if (oFilter) aFilters.push(oFilter);

            oFilter = createMultiFilter(aDivision, "Division");
            if (oFilter) aFilters.push(oFilter);

            oFilter = createMultiFilter(aPlant, "Plant");
            if (oFilter) aFilters.push(oFilter);


            // -----------------------------
            // MultiInput fields
            // -----------------------------
            var aCustomer = getMultiInputValues("customerSmartField");
            var aBillingDoc = getMultiInputValues("idBillingDoc");

            oFilter = createMultiFilter(aCustomer, "Customer");
            if (oFilter) aFilters.push(oFilter);

            oFilter = createMultiFilter(aBillingDoc, "BillingDocument");
            if (oFilter) aFilters.push(oFilter);

            // -----------------------------
            // Billing Date Range
            // -----------------------------
            var oDateRange = oView.byId("idBillingDate");

            var oFrom = oDateRange.getDateValue();
            var oTo = oDateRange.getSecondDateValue();

            if (oFrom && oTo) {

                aFilters.push(new sap.ui.model.Filter({
                    path: "BillingDocumentDate",
                    operator: sap.ui.model.FilterOperator.BT,
                    value1: oFrom,
                    value2: oTo
                }));

            }

            // -----------------------------
            // Call OData service
            // -----------------------------
            var that = this;
            var oFilterModel = new sap.ui.model.json.JSONModel({
                filters: aFilters,
                BillingType: sBillingType,
                DivisionType: aDivision[0],
                DocStatus: sOverallStatus
            });
            that.getOwnerComponent().setModel(oFilterModel, "FilterModel");
            this.getOwnerComponent().getRouter().navTo("RouteObject");

        }
    });
});