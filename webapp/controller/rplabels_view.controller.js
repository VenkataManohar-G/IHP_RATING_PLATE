sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/library",
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet",
    "sap/m/Dialog",
    "sap/m/library",
    "sap/m/Button",
    "sap/m/Text",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/m/SearchField",
    "sap/ui/table/Column",
    "sap/m/Column",
    "sap/m/Label",
    "sap/ui/model/type/String",
    "sap/ui/comp/library",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/ui/core/message/Message",
    "sap/m/MessageBox"
], (Controller, coreLibrary, exportLibrary, Spreadsheet, Dialog, mobileLibrary, Button, Text, Sorter, Filter,
    SearchField, UIColumn, MColumn, Label, TypeString, compLibrary, FilterOperator, Fragment, Message, MessageBox) => {
    "use strict";
    var addDefaultEntries = [];
    var addEntriesLength = 0, oBusyDialog, oAutoSearchDialog;
    var oAddEntryModel = new sap.ui.model.json.JSONModel(), omaterialsModel = new sap.ui.model.json.JSONModel(), oallmaterialsModel = new sap.ui.model.json.JSONModel(), ouserModel = new sap.ui.model.json.JSONModel(), materialLogs = [];
    var i, oMatInput, oExecuteBusyModel;
    var ValueState = coreLibrary.ValueState;
    var sUrl = "https://labelcloudapi.onnicelabel.com/Trigger/v1/CloudTrigger/Api-CloudIntegrationDemo-Print";
    return Controller.extend("rplabels.controller.rplabels_view", {
        onInit() {
            this._add_initial_entries();
        },
        onBeforeRendering() {
            var oModel = this.getOwnerComponent().getModel();
            this._getuserdetails(oModel);
        },
        _add_initial_entries: function () {
            var that = this;
            for (i = 0; i <= 9; i++) {
                var addDefaultEntry = {};
                addDefaultEntry.Id = i;
                addDefaultEntry.Label = '';
                addDefaultEntry.Material = '';
                addDefaultEntry.Message = ''
                addDefaultEntry.Status = ''
                addDefaultEntries.push(addDefaultEntry);
            }
            oAddEntryModel.setData(addDefaultEntries);
            that.getView().setModel(oAddEntryModel, "Entries");
            oAddEntryModel.refresh(true);
        },
        _getuserdetails: function (oModel) {
            oModel.read("/CurrentUser", {
                success: function (oData) {
                    var aUser = oData.results;
                    var that = this;
                    if (aUser.length > 0) {
                        ouserModel.setData(aUser);
                        //that.getView().setModel(ouserModel,"Userdetails");
                        //that.getView().bindElement("/Userdetails/0");
                        that.getView().byId("id_job").setValue(aUser[0].jobname);
                        console.log(aUser[0].jobname);
                    } else {
                    }
                }.bind(this),
                error: function (oError) {
                }.bind(this)
            });
        },
        /*Plant Value Help*/
        onPlantVH: function (oEvent) {
            this._oBasicSearchFieldWithSuggestionsPlant = new SearchField();
            this.pDialogWithSuggestions = this.loadFragment({
                name: "rplabels.view.PlantVH"
            }).then(function (oDialogSuggestions) {
                var oFilterBar = oDialogSuggestions.getFilterBar(), oPlantID, oPlantName, oColumnEmpName,
                    oColumnEmployeeId, oColumnBusinessPartner, oUserIdVH, oCompanyCodeVH, oCostcenterVH;
                this._oVHPlantWithSuggestions = oDialogSuggestions;
                this.getView().addDependent(oDialogSuggestions);
                // Set key fields for filtering in the Define Conditions Tab
                oDialogSuggestions.setRangeKeyFields([{
                    label: "Plant",
                    key: "Plant",
                    type: "string",
                    typeInstance: new TypeString({}, {
                        maxLength: 10
                    })
                }]);
                // Set Basic Search for FilterBar
                oFilterBar.setFilterBarExpanded(false);
                oFilterBar.setBasicSearch(this._oBasicSearchFieldWithSuggestionsPlant);

                // Trigger filter bar search when the basic search is fired
                this._oBasicSearchFieldWithSuggestionsPlant.attachSearch(function () {
                    oFilterBar.search();
                });
                oDialogSuggestions.getTableAsync().then(function (oTable) {
                    // For Desktop and tabled the default table is sap.ui.table.Table
                    if (oTable.bindRows) {
                        // Bind rows to the ODataModel and add columns
                        oTable.bindAggregation("rows", {
                            path: "/Plants",
                            events: {
                                dataReceived: function () {
                                    oDialogSuggestions.update();
                                }
                            }
                        });
                        oPlantID = new UIColumn({ label: new Label({ text: "Plant" }), template: new Text({ wrapping: false, text: "{Plant}" }) });
                        oPlantID.data({
                            fieldName: "Plant"
                        });
                        oTable.addColumn(oPlantID);

                        oPlantName = new UIColumn({ label: new Label({ text: "PlantName" }), template: new Text({ wrapping: false, text: "{PlantName}" }) });
                        oPlantName.data({
                            fieldName: "PlantName"
                        });
                        oTable.addColumn(oPlantName);
                    }
                }.bind(this));
                oDialogSuggestions.open();
            }.bind(this));
        },
        onValueHelpPlantVHOkPress: async function (oEvent) {
            var that = this,
                aTokens = oEvent.getParameter("tokens"),
                oModel = this.getView().getModel();
            if (aTokens.length > 0) {
                var oFilter = [],
                    oPlantfilter;
                var oText = aTokens[0].getKey();
                var oselectedSet = aTokens[0].getAggregation("customData");
                var oselectedData = oselectedSet[0].getProperty("value");
                var oPlant = this.byId("id_plant");
                oPlant.setValue(oText);
                /*   oPlantfilter = new sap.ui.model.Filter("Plant", "EQ", oText);
                   oFilter.push(oPlantfilter)
                   let oMaterials = await that._getPlantmaterials(oModel, oFilter);
                   if (oMaterials) {
                       oallmaterialsModel.setData(oMaterials);
                       that.getView().setModel(oallmaterialsModel, "AllMaterials");
                       oBusyDialog.close();
                   } else {
                       oallmaterialsModel.setData(oMaterials);
                       oallmaterialsModel.refresh();
                       that.getView().setModel(oallmaterialsModel, "AllMaterials");
                       oBusyDialog.close();
                   } */
            }
            this._oVHPlantWithSuggestions.close();
        },
        onValueHelpPlantVHCancelPress: function (oEvent) {
            this._oVHPlantWithSuggestions.close();
        },
        onValueHelpPlantVHAfterClose: function (oEvent) {
            this._oVHPlantWithSuggestions.destroy();
        },
        onFilterBarWithSuggestionsPlantVHSearch: function (oEvent) {
            var sSearchQuery = this._oBasicSearchFieldWithSuggestionsPlant.getValue(),
                aSelectionSet = oEvent.getParameter("selectionSet"),
                aFilters = aSelectionSet.reduce(function (aResult, oControl) {
                    if (oControl.getValue()) {
                        aResult.push(new Filter({
                            path: oControl.getName(),
                            operator: FilterOperator.Contains,
                            value1: oControl.getValue()
                        }));
                    }

                    return aResult;
                }, []);

            aFilters.push(new Filter({
                filters: [
                    new Filter({ path: "PlantName", operator: FilterOperator.Contains, value1: sSearchQuery }),
                ],
                and: false
            }));

            this._filterTableWithSuggestionsPlant(new Filter({
                filters: aFilters,
                and: true
            }));
        },
        _filterTableWithSuggestionsPlant: function (oFilter) {
            var oVHDPlant = this._oVHPlantWithSuggestions;
            oVHDPlant.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }
                oVHDPlant.update();
            });
        },
        onPlantChange: async function (oEvent) {
            var that = this,
                oFilter = [],
                oPlantfilter,
                oValidatedPlant = oEvent.getSource(),
                sSelectedKey = oEvent.getParameter("newValue"),
                oModel = this.getView().getModel();
            oModel.setSizeLimit(999999);
            let oPlant = await that._plantValidation(oModel, sSelectedKey);
            if (sSelectedKey !== oPlant) {
                oValidatedPlant.setValueState(ValueState.Error);
                oValidatedPlant.setValueStateText("Please enter a valid Plant!");
            } else {
                oValidatedPlant.setValueState(ValueState.None);
            }
        },
        onMaterialliveChange: async function (oEvent) {
            var oModel = this.getView().getModel(),
                oPlant = this.getView().byId("id_plant").getValue(),
                sNewValue = oEvent.getParameter("value"),
                that = this,
                oFilter = [],
                oPlantfilter,
                oMaterialfilter;
            if (oPlant) {
                oMaterialfilter = new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, sNewValue),
                        new sap.ui.model.Filter("MaterialText", sap.ui.model.FilterOperator.Contains, sNewValue)
                    ],
                    and: false
                });
                oFilter.push(oMaterialfilter);
                oPlantfilter = new sap.ui.model.Filter("Plant", "EQ", oPlant);
                oFilter.push(oPlantfilter);
                let oMaterials = await that._getPlantmaterials(oModel, oFilter);
                if (oMaterials) {
                    omaterialsModel.setData(oMaterials);
                    that.getView().setModel(omaterialsModel, "Materials");
                } else {
                    omaterialsModel.setData(oMaterials);
                    omaterialsModel.refresh();
                    that.getView().setModel(omaterialsModel, "Materials");
                }
            } else {
                MessageBox.warning("Plant is Mandatory");
            }

        },
        _plantValidation: function (oModel, sInputValue) {
            return new Promise((resolve, reject) => {
                oModel.read("/Plants", {
                    filters: [new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, sInputValue)],
                    success: function (oData) {
                        var aPlants = oData.results;
                        if (aPlants.length > 0) {
                            resolve(aPlants[0].Plant);
                        } else {
                            resolve();
                        }
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },
        _getPlantmaterials: function (oModel, filters) {
            return new Promise((resolve, reject) => {
                oModel.read("/Materials", {
                    filters: filters,
                    urlParameters: { "$top": 200 },
                    success: function (oData) {
                        var aMaterials = oData.results;
                        if (aMaterials.length > 0) {
                            resolve(aMaterials);
                        } else {
                            resolve();
                        }
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },
        onMaterialVH: async function (oEvent) {
            oMatInput = oEvent.getSource();
            var sInputValue = oEvent.getSource().getValue(),
                oPlant = this.getView().byId("id_plant").getValue(),
                oView = this.getView(),
                oFilter = [],
                oPlantfilter,
                oModel = this.getView().getModel(),
                that = this;

            oPlantfilter = new sap.ui.model.Filter("Plant", "EQ", oPlant);
            oFilter.push(oPlantfilter);
            let oMaterials = await that._getPlantmaterials(oModel, oFilter);
            if (oMaterials) {
                oallmaterialsModel.setData(oMaterials);
                oallmaterialsModel.refresh();
                that.getView().setModel(oallmaterialsModel, "AllMaterials");
            } else {
                oallmaterialsModel.setData(oMaterials);
                oallmaterialsModel.refresh();
                that.getView().setModel(oallmaterialsModel, "AllMaterials");
            }
            if (!this._pValueHelpDialog) {
                this._pValueHelpDialog = Fragment.load({
                    id: oView.getId(),
                    name: "rplabels.view.MaterialVH",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pValueHelpDialog.then(function (oDialog) {
                // Create a filter for the binding
                if (sInputValue) {
                    //oDialog.getBinding("items").filter([new Filter("Material", FilterOperator.Contains, sInputValue)]);
                    // Open ValueHelpDialog filtered by the input's value
                    oDialog.open(sInputValue);
                } else {
                    oDialog.open();
                }
            });
        },
        onValueHelpmaterialSearch: async function (oEvent) {
            var oFilter = [], oPlantfilter, oMaterialfilter,
                oPlant = this.getView().byId("id_plant").getValue(),
                oModel = this.getView().getModel(),
                sValue = oEvent.getParameter("value"),
                that = this;
            if (sValue) {
                oMaterialfilter = new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, sValue),
                        new sap.ui.model.Filter("MaterialText", sap.ui.model.FilterOperator.Contains, sValue)
                    ],
                    and: false
                });
                oFilter.push(oMaterialfilter);
            }
            oPlantfilter = new sap.ui.model.Filter("Plant", "EQ", oPlant);
            oFilter.push(oPlantfilter);
            let oMaterials = await that._getPlantmaterials(oModel, oFilter);
            if (oMaterials) {
                oallmaterialsModel.setData(oMaterials);
                oallmaterialsModel.refresh();
                that.getView().setModel(oallmaterialsModel, "AllMaterials");
            } else {
                oallmaterialsModel.setData(oMaterials);
                oallmaterialsModel.refresh();
                that.getView().setModel(oallmaterialsModel, "AllMaterials");
            }

        },
        onValueHelpmaterialClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var oValue = oSelectedItem.getDescription();
                oMatInput.setValue(oValue);
            }

        },
        onAddEntry: function (oEvent) {
            var that = this;
            var addDefaultEntry = {};
            i = i + 1;
            addDefaultEntry.Id = i;
            addDefaultEntry.Label = '';
            addDefaultEntry.Material = '';
            addDefaultEntry.Message = ''
            addDefaultEntry.Status = ''
            addDefaultEntries.push(addDefaultEntry);
            oAddEntryModel.setData(addDefaultEntries);
            that.getView().setModel(oAddEntryModel, "Entries");
            oAddEntryModel.refresh(true);
        },
        deleteRow: function (oEvent) {
            var that;
            that = this;
            var getRemoveIndex = oEvent.getParameter("listItem");
            var oCells = getRemoveIndex.getCells();
            var sId = oCells[0].getValue();
            var iId = sId * 1;
            const index = addDefaultEntries.findIndex((obj) => (obj.Id) === iId);
            if (index !== -1) {
                addDefaultEntries.splice(index, 1);
                oAddEntryModel.setData(addDefaultEntries);
                that.getView().setModel(oAddEntryModel, "Entries");
                oAddEntryModel.refresh(true);
            }
            var oTable = this.getView().byId("tableId1");
            oTable.removeItem(oEvent.getParameter("listItem"));
        },
        onExecute: async function (oEvent) {
            var oListData = [], oFilter = [], filterMaterial, filterPlant;
            var RecordTable = this.getView().byId("tableId1");
            var newEntries = RecordTable.getBinding("items");
            var oPlant = this.getView().byId("id_plant").getValue();
            var oPrinter = this.getView().byId("id_printer").getValue();
            var that = this, oModel = this.getView().getModel();
            oListData = newEntries.oList;
            oExecuteBusyModel = new sap.m.BusyDialog({
                title: "Loading Data",
                text: "Please wait....."
            });
            oExecuteBusyModel.open();
            console.log(oListData);
            oListData.forEach(function (oItem, Index) {
                console.log(oItem.Material);
                if (oItem.Material) {
                    filterMaterial = new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, oItem.Material)
                        ],
                        and: false
                    });
                    oFilter.push(filterMaterial);
                }
            });
            filterPlant = new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, oPlant);
            oFilter.push(filterPlant);
            console.log(oFilter);
            try {
                var oMaterialData = await that._getmaterialDetails(oModel, oFilter);
                if (oMaterialData) {
                    for (var Material of oMaterialData) {
                        try {
                            if (Material) {
                                var oLoftware = {}, Variables = {};
                                var urllabel = "/Labels/" + Material.rp001 + ".nlbl";
                                oLoftware.Variables = [];
                                oLoftware.FilePath = urllabel;
                                oLoftware.FileVersion = "";
                                oLoftware.Quantity = "1";
                                oLoftware.Printer = oPrinter;
                                oLoftware.PrinterSettings = "";
                                if (Material.Material) {
                                    Variables.CATALOG_NUMBER = Material.Material;
                                }
                                if (Material.insepectionMemo) {
                                    Variables.MODEL_NUMBER = Material.insepectionMemo;
                                }
                                if (Material.quantity_GRGI) {
                                    Variables.GR_SLIPS_QTY = Material.quantity_GRGI;
                                }
                                if (Material.labelFrom) {
                                    Variables.LABEL_FORM = Material.labelFrom;
                                }
                                if (Material.labelType) {
                                    Variables.LABEL_TYPE = Material.labelType;
                                }
                                if (Material.materialOld) {

                                }
                                if (Material.articleNo_EAN_UPC) {
                                    Variables.UPC_NUMBER = Material.articleNo_EAN_UPC;
                                }
                                if (Material.materialGroup) {
                                    Variables.BRAND_NAME = Material.materialGroup;
                                }
                                if (Material.materialDescription) {
                                    Variables.DESCRIPTION = Material.materialDescription;
                                }
                                if (Material.serialNo) {
                                    Variables.SERIAL_NUMBER = Material.serialNo;
                                }
                                if (Material.objectListNo) {

                                }
                                if (Material.orderNo) {
                                    Variables.PROD_ORDER = Material.orderNo;
                                }
                                if (Material.objectlistCounter) {
                                    Variables.SEQ_NUM = Material.objectlistCounter;
                                }
                                if (Material.objectlisCounterMax) {
                                    Variables.SEQ_QTY = Material.objectlisCounterMax;
                                }
                                if (Material.materialSubstitute) {
                                    Variables.CUST_PART_NUMBER = Material.materialSubstitute;
                                }
                                if (Material.userText) {
                                    Variables.CUSTOM_TXT = Material.userText;
                                }
                                if (Material.location) {
                                    if (oPlant == "1710") {
                                        Variables.LOCATION = "Russellville, AL";
                                    } else if (oPlant == "2910") {
                                        Variables.LOCATION = "Toronto, ON";
                                    }
                                }
                                if (Material.rp001) {
                                    Variables.RP001 = Material.rp001;
                                }
                                if (Material.rp002) {
                                    Variables.RP002 = Material.rp002;
                                }
                                if (Material.rp003) {
                                    Variables.RP002 = Material.rp003;
                                }
                                if (Material.rp004) {
                                    Variables.RP004 = Material.rp004;
                                }
                                if (Material.rp005) {
                                    Variables.RP005 = Material.rp005;
                                }
                                if (Material.rp006) {
                                    Variables.RP006 = Material.rp006;
                                }
                                if (Material.rp007) {
                                    Variables.RP007 = Material.rp007;
                                }
                                if (Material.rp008) {
                                    Variables.RP008 = Material.rp008;
                                }
                                if (Material.rp009) {
                                    Variables.RP009 = Material.rp009;
                                }
                                if (Material.rp011) {
                                    Variables.RP011 = Material.rp011;
                                }
                                if (Material.rp012) {
                                    Variables.RP012 = Material.rp012;
                                }
                                if (Material.rp013) {
                                    Variables.RP013 = Material.rp013;
                                }
                                if (Material.rp014) {
                                    Variables.RP014 = Material.rp014;
                                }
                                if (Material.rp015) {
                                    Variables.RP015 = Material.rp015;
                                }
                                if (Material.rp016) {
                                    Variables.RP016 = Material.rp016;
                                }
                                if (Material.rp017) {
                                    Variables.RP017 = Material.rp017;
                                }
                                if (Material.rp018) {
                                    Variables.RP018 = Material.rp018;
                                }
                                if (Material.rp019) {
                                    Variables.RP019 = Material.rp019;
                                }
                                if (Material.rp020) {
                                    Variables.RP020 = Material.rp020;
                                }
                                if (Material.rp021) {
                                    Variables.RP021 = Material.rp021;
                                }
                                if (Material.rp022) {
                                    Variables.RP022 = Material.rp022;
                                }
                                if (Material.rp023) {
                                    Variables.RP023 = Material.rp023;
                                }
                                if (Material.rp024) {
                                    Variables.RP024 = Material.rp024;
                                }
                                if (Material.rp025) {
                                    Variables.RP025 = Material.rp025;
                                }
                                if (Material.rp026) {
                                    Variables.RP026 = Material.rp026;
                                }
                                if (Material.rp027) {
                                    Variables.RP027 = Material.rp027;
                                }
                                if (Material.rp028) {
                                    Variables.RP028 = Material.rp028;
                                }
                                if (Material.rp029) {
                                    Variables.RP029 = Material.rp029;
                                }
                                if (Material.rp030) {
                                    Variables.RP030 = Material.rp030;
                                }
                                if (Material.rp031) {
                                    Variables.RP031 = Material.rp031;
                                }
                                if (Material.rp032) {
                                    Variables.RP032 = Material.rp032;
                                }
                                if (Material.rp033) {
                                    Variables.RP033 = Material.rp033;
                                }
                                if (Material.rp034) {
                                    Variables.RP034 = Material.rp034;
                                }
                                if (Material.rp035) {
                                    Variables.RP035 = Material.rp035;
                                }
                                if (Material.rp036) {
                                    Variables.RP036 = Material.rp036;
                                }
                                if (Material.rp037) {
                                    Variables.RP037 = Material.rp037;
                                }
                                if (Material.rp038) {
                                    Variables.RP038 = Material.rp038;
                                }
                                if (Material.rp039) {
                                    Variables.RP039 = Material.rp039;
                                }
                                if (Material.rp040) {
                                    Variables.RP040 = Material.rp040;
                                }
                                if (Material.rp041) {
                                    Variables.RP041 = Material.rp041;
                                }
                                if (Material.rp042) {
                                    Variables.RP042 = Material.rp042;
                                }
                                if (Material.rp043) {
                                    Variables.RP043 = Material.rp043;
                                }
                                if (Material.rp044) {
                                    Variables.RP044 = Material.rp044;
                                }
                                if (Material.rp045) {
                                    Variables.RP045 = Material.rp045;
                                }
                                if (Material.rp046) {
                                    Variables.RP046 = Material.rp046;
                                }
                                if (Material.rp047) {
                                    Variables.RP047 = Material.rp047;
                                }
                                if (Material.rp048) {
                                    Variables.RP048 = Material.rp048;
                                }
                                if (Material.rp049) {
                                    Variables.RP049 = Material.rp049;
                                }
                                if (Material.rp050) {
                                    Variables.RP050 = Material.rp050;
                                }
                                if (Material.rp051) {
                                    Variables.RP051 = Material.rp051;
                                }
                                if (Material.rp052) {
                                    Variables.RP052 = Material.rp052;
                                }
                                if (Material.rp053) {
                                    Variables.RP053 = Material.rp053;
                                }
                                if (Material.rp054) {
                                    Variables.RP054 = Material.rp054;
                                }
                                if (Material.rp055) {
                                    Variables.RP055 = Material.rp055;
                                }
                                if (Material.rp056) {
                                    Variables.RP056 = Material.rp056;
                                }
                                if (Material.rp057) {
                                    Variables.RP057 = Material.rp057;
                                }
                                if (Material.rp058) {
                                    Variables.RP058 = Material.rp058;
                                }
                                if (Material.rp059) {
                                    Variables.RP059 = Material.rp059;
                                }
                                if (Material.rp060) {
                                    Variables.RP060 = Material.rp060;
                                }
                                oLoftware.Variables.push(Variables);
                                var oLoftwareJson = JSON.stringify(oLoftware);
                                try {
                                    var oResult = await that._sendcrlabels(sUrl, oLoftwareJson, Material.Material);
                                } catch (error) {
                                    console.log('error logged');
                                    continue;
                                }

                            }
                        } catch (error) {
                            oExecuteBusyModel.close();
                            MessageBox.error("No Materials Data found to print labels");
                        }
                    };
                    if (materialLogs) {
                        var oModel = this.getView().getModel("Entries");
                        var oData = oModel.getData();
                        console.log(oData);
                        for (var i = 0; i < oData.length; i++) {
                            if (oData[i].Label && oData[i].Material) {
                                let filteredLogs = materialLogs.filter(function (item) {
                                    return item.Material === oData[i].Material;
                                });
                                oData[i].Status = filteredLogs[0].Status;
                                oData[i].Message = filteredLogs[0].Message;
                            }
                        }
                        oModel.refresh();
                    }
                    oExecuteBusyModel.close();
                } else {
                    oExecuteBusyModel.close();
                    MessageBox.error("No Materials Data found to print labels");
                }
            } catch (error) {
                MessageBox.warning("No Materials Found!! Please try again");
                oExecuteBusyModel.close();
            }
        },
        _getmaterialDetails: async function (oModel, oFilter) {
            return new Promise((resolve, reject) => {
                oModel.read("/MaterialsData", {
                    filters: oFilter,
                    urlParameters: { "$top": 2000 },
                    success: function (oData) {
                        var aMaterialsData = oData.results;
                        if (aMaterialsData.length > 0) {
                            resolve(aMaterialsData);
                        } else {
                            resolve("404");
                        }
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },
        _sendcrlabels: async function (sUrl, oLoftwareJson, Material) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    type: "POST",
                    url: sUrl,
                    dataType: "json",
                    contentType: "application/json",
                    data: oLoftwareJson,
                    crossDomain: true,
                    headers: {
                        "Ocp-Apim-Subscription-Key": "d79514cfdffe4c229ac15b52fbf9adc8"
                    },
                    success: function (response) {
                        console.log("Success:", response);
                        resolve({ status: 'S', Message: 'Successfully' });
                        if (response) {
                            var sResponse = response.Response;
                        }
                        materialLogs.push({ Status: 'S', Message: sResponse, Material: Material })
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        console.log("Error:", xhr);
                        reject({ status: 'E', Message: xhr.responseText });
                        var sMessage = JSON.parse(xhr.responseText);
                        if (sMessage) {
                            var aMessage = sMessage.Message;
                        }
                        materialLogs.push({ Status: 'E', Message: aMessage, Material: Material })
                    }
                });
            })
        },
        onReset: function () {
            var that = this;
            addDefaultEntries = [];
            for (i = 0; i <= 9; i++) {
                var addDefaultEntry = {};
                addDefaultEntry.Id = i;
                addDefaultEntry.Label = '';
                addDefaultEntry.Material = '';
                addDefaultEntry.Message = ''
                addDefaultEntry.Status = ''
                addDefaultEntries.push(addDefaultEntry);
            }
            oAddEntryModel.setData(addDefaultEntries);
            that.getView().setModel(oAddEntryModel, "Entries");
            oAddEntryModel.refresh(true);
        }

    });
});