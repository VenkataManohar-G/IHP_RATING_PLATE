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
    "sap/ui/core/message/Message"
], (Controller, coreLibrary, exportLibrary, Spreadsheet, Dialog, mobileLibrary, Button, Text, Sorter, Filter,
    SearchField, UIColumn, MColumn, Label, TypeString, compLibrary, FilterOperator, Fragment, Message) => {
    "use strict";
    var addDefaultEntries = [];
    var addEntriesLength = 0, oBusyDialog, oAutoSearchDialog;
    var oAddEntryModel, omaterialsModel = new sap.ui.model.json.JSONModel(), oallmaterialsModel = new sap.ui.model.json.JSONModel(),ouserModel = new sap.ui.model.json.JSONModel();
    var i, oMatInput,oExecuteBusyModel;
    var ValueState = coreLibrary.ValueState;
    var sUrl = "https://labelcloudapi.onnicelabel.com/Trigger/v1/CloudTrigger/Api-CloudIntegrationDemo-Print";
    return Controller.extend("rplabels.controller.rplabels_view", {
        onInit() {
            this._add_initial_entries();
        },
        onBeforeRendering(){
            var oModel = this.getOwnerComponent().getModel();
            this._getuserdetails(oModel);
        },
        _add_initial_entries: function () {
            var that = this;
            oAddEntryModel = new sap.ui.model.json.JSONModel();
            for (i = 0; i <= 9; i++) {
                var addDefaultEntry = {};
                addDefaultEntry.Id = i;
                addDefaultEntry.Label = '';
                addDefaultEntry.Material = '';
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
                /* oPlantfilter = new sap.ui.model.Filter("Plant", "EQ", oPlant);
                 oFilter.push(oPlantfilter);
                 let oMaterials = await that._getPlantmaterials(oModel, oFilter);
                 if (oMaterials) {
                     oallmaterialsModel.setData(oMaterials);
                     that.getView().setModel(oallmaterialsModel, "AllMaterials");
                 } else {
                     oallmaterialsModel.setData(oMaterials);
                     oallmaterialsModel.refresh();
                     that.getView().setModel(oallmaterialsModel, "AllMaterials");
                 } */

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
            oAddEntryModel = new sap.ui.model.json.JSONModel();
            i = i + 1;
            addDefaultEntry.Id = i;
            addDefaultEntry.Label = '';
            addDefaultEntry.Material = '';
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
            oAddEntryModel = new sap.ui.model.json.JSONModel();
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
        onExecute: async function (oEvent){
            var oListData = [],oFilter = [],filterMaterial,filterPlant;
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
                if(oItem.Material){
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
            var oMaterialData = await that._getmaterialDetails(oModel,oFilter);
            for(var Material of oMaterialData) {
                try {
                   if(Material){
                    var oLoftware = {},Variables = {};
                    var urllabel = "/Labels/"+Material.rp001+".nlbl";
                    oLoftware.Variables = [];
                    oLoftware.FilePath = urllabel;
                    oLoftware.FileVersion = "";
                    oLoftware.Quantity = "1";
                    oLoftware.Printer = oPrinter;
                    oLoftware.PrinterSettings = "";
                    if(Material.Material){
                        Variables = {};
                        Variables.CATALOG_NUMBER = Material.Material;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.insepectionMemo){
                        Variables = {};
                        Variables.MODEL_NUMBER = Material.insepectionMemo;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.quantity_GRGI){
                        Variables = {};
                        Variables.GR_SLIPS_QTY = Material.quantity_GRGI;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.labelFrom){
                        Variables = {};
                        Variables.LABEL_FORM = Material.labelFrom; 
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.labelType){
                        Variables = {};
                        Variables.LABEL_TYPE = Material.labelType;
                        oLoftware.Variables.push(Variables);
                    }    
                    if(Material.materialOld){
                        
                    }
                    if(Material.articleNo_EAN_UPC){
                        Variables = {};
                        Variables.UPC_NUMBER = Material.articleNo_EAN_UPC;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.materialGroup){
                        Variables = {};
                        Variables.BRAND_NAME = Material.materialGroup;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.materialDescription){
                        Variables = {};
                        Variables.DESCRIPTION = Material.materialDescription;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.serialNo){
                        Variables = {};
                        Variables.SERIAL_NUMBER = Material.serialNo;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.objectListNo){
                        
                    }
                    if(Material.orderNo){
                        Variables = {};
                        Variables.PROD_ORDER = Material.orderNo;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.objectlistCounter){
                        Variables = {};
                        Variables.SEQ_NUM = Material.objectlistCounter;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.objectlisCounterMax){
                        Variables = {};
                        Variables.SEQ_QTY = Material.objectlisCounterMax;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.materialSubstitute){
                        Variables = {};
                        Variables.CUST_PART_NUMBER = Material.materialSubstitute;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.userText){
                        Variables = {};
                        Variables.CUSTOM_TXT = Material.userText;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.location){
                        Variables = {};
                        Variables.LOCATION = Material.location;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp001){
                        Variables = {};
                        Variables.RP001 = Material.rp001;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp002){
                        Variables = {};
                        Variables.RP002 = Material.rp002;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp003){
                        Variables = {};
                        Variables.RP002 = Material.rp003;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp004){
                        Variables = {};
                        Variables.RP004 = Material.rp004;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp005){
                        Variables = {};
                        Variables.RP005 = Material.rp005;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp006){
                        Variables = {};
                        Variables.RP006 = Material.rp006;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp007){
                        Variables = {};
                        Variables.RP007 = Material.rp007;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp008){
                        Variables = {};
                        Variables.RP008 = Material.rp008;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp009){
                        Variables = {};
                        Variables.RP009 = Material.rp009;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp011){
                        Variables = {};
                        Variables.RP011 = Material.rp011;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp012){
                        Variables = {};
                        Variables.RP012 = Material.rp012;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp013){
                        Variables = {};
                        Variables.RP013 = Material.rp013;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp014){
                        Variables = {};
                        Variables.RP014 = Material.rp014;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp015){
                        Variables = {};
                        Variables.RP015 = Material.rp015;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp016){
                        Variables = {};
                        Variables.RP016 = Material.rp016;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp017){
                        Variables = {};
                        Variables.RP017 = Material.rp017;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp018){
                        Variables = {};
                        Variables.RP018 = Material.rp018;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp019){
                        Variables = {};
                        Variables.RP019 = Material.rp019;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp020){
                        Variables = {};
                        Variables.RP020 = Material.rp020;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp021){
                        Variables = {};
                        Variables.RP021 = Material.rp021;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp022){
                        Variables = {};
                        Variables.RP022 = Material.rp022;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp023){
                        Variables = {};
                        Variables.RP023 = Material.rp023;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp024){
                        Variables = {};
                        Variables.RP024 = Material.rp024;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp025){
                        Variables = {};
                        Variables.RP025 = Material.rp025;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp026){
                        Variables = {};
                        Variables.RP026 = Material.rp026;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp027){
                        Variables = {};
                        Variables.RP027 = Material.rp027;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp028){
                        Variables = {};
                        Variables.RP028 = Material.rp028;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp029){
                        Variables = {};
                        Variables.RP029 = Material.rp029;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp030){
                        Variables = {};
                        Variables.RP030 = Material.rp030;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp031){
                        Variables = {};
                        Variables.RP031 = Material.rp031;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp032){
                        Variables = {};
                        Variables.RP032 = Material.rp032;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp033){
                        Variables = {};
                        Variables.RP033 = Material.rp033;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp034){
                        Variables = {};
                        Variables.RP034 = Material.rp034;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp035){
                        Variables = {};
                        Variables.RP035 = Material.rp035;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp036){
                        Variables = {};
                        Variables.RP036 = Material.rp036;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp037){
                        Variables = {};
                        Variables.RP037 = Material.rp037;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp038){
                        Variables = {};
                        Variables.RP038 = Material.rp038;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp039){
                        Variables = {};
                        Variables.RP039 = Material.rp039;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp040){
                        Variables = {};
                        Variables.RP040 = Material.rp040;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp041){
                        Variables = {};
                        Variables.RP041 = Material.rp041;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp042){
                        Variables = {};
                        Variables.RP042 = Material.rp042;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp043){
                        Variables = {};
                        Variables.RP043 = Material.rp043;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp044){
                        Variables = {};
                        Variables.RP044 = Material.rp044;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp045){
                        Variables = {};
                        Variables.RP045 = Material.rp045;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp046){
                        Variables = {};
                        Variables.RP046 = Material.rp046;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp047){
                        Variables = {};
                        Variables.RP047 = Material.rp047;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp048){
                        Variables = {};
                        Variables.RP048 = Material.rp048;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp049){
                        Variables = {};
                        Variables.RP049 = Material.rp049;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp050){
                        Variables = {};
                        Variables.RP050 = Material.rp050;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp051){
                        Variables = {};
                        Variables.RP051 = Material.rp051;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp052){
                        Variables = {};
                        Variables.RP052 = Material.rp052;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp053){
                        Variables = {};
                        Variables.RP053 = Material.rp053;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp054){
                        Variables = {};
                        Variables.RP054 = Material.rp054;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp055){
                        Variables = {};
                        Variables.RP055 = Material.rp055;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp056){
                        Variables = {};
                        Variables.RP056 = Material.rp056;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp057){
                        Variables = {};
                        Variables.RP057 = Material.rp057;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp058){
                        Variables = {};
                        Variables.RP058 = Material.rp058;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp059){
                        Variables = {};
                        Variables.RP059 = Material.rp059;
                        oLoftware.Variables.push(Variables);
                    }
                    if(Material.rp060){
                        Variables = {};
                        Variables.RP060 = Material.rp060;
                        oLoftware.Variables.push(Variables);
                    }
                    var oLoftwareJson = JSON.stringify(oLoftware); 
                    var oResult = await that._sendcrlabels(sUrl,oLoftwareJson);
                    oExecuteBusyModel.close();          
                   } 
                } catch (error) {
                    
                }
            };
        },
        _getmaterialDetails : async function(oModel,oFilter) {
            return new Promise((resolve,reject) => {
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
        _sendcrlabels: async function(sUrl,oLoftwareJson) {
            return new Promise((resolve,reject)=>{
                $.ajax({
                    type: "POST",
                    url: sUrl,
                    dataType: "json",
                    contentType: "application/json",
                    data: oLoftwareJson,
                    crossDomain: true,
                    headers: {
                        "Ocp-Apim-Subscription-Key" : "d79514cfdffe4c229ac15b52fbf9adc8"
                    },
                    success: function(response) {
                      console.log("Success:", response);
                      resolve(response);
                    },
                    error: function(xhr, textStatus, errorThrown) {
                      console.log("Error:", errorThrown);
                      reject(errorThrown);
                    }
                  });
            })
        }

    });
});