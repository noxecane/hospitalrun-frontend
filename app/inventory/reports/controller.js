import AbstractReportController from 'hospitalrun/controllers/abstract-report-controller';
import Ember from 'ember';
import InventoryAdjustmentTypes from 'hospitalrun/mixins/inventory-adjustment-types';
import LocationName from 'hospitalrun/mixins/location-name';
import ModalHelper from 'hospitalrun/mixins/modal-helper';
import moment from 'moment';
import Discount from 'hospitalrun/mixins/discount';
import NumberFormat from 'hospitalrun/mixins/number-format';
import SelectValues from 'hospitalrun/utils/select-values';
import funk from 'hospitalrun/utils/funk';
export default AbstractReportController.extend(LocationName, ModalHelper, NumberFormat, InventoryAdjustmentTypes, Discount, {
  inventoryController: Ember.inject.controller('inventory'),
  effectiveDate: null,
  endDate: null,
  expenseCategories: Ember.computed(function() {
    let i18n = this.get('i18n');
    return [i18n.t('inventory.labels.inventoryConsumed'), i18n.t('inventory.labels.giftUsage'), i18n.t('inventory.labels.inventoryObsolence')];
  }),
  expenseMap: null,
  filterLocation: null,
  grandCost: 0,
  grandQuantity: 0,
  locationSummary: null,
  reportType: 'daysLeft',
  startDate: null,

  database: Ember.inject.service(),
  warehouseList: Ember.computed.map('inventoryController.warehouseList.value', SelectValues.selectValuesMap),
  reportColumns: Ember.computed(function() {
    let i18n = this.get('i18n');
    return {
      date: {
        label: i18n.t('labels.date'),
        include: true,
        property: 'date'
      },
      id: {
        label: i18n.t('labels.id'),
        include: true,
        property: 'inventoryItem.friendlyId'
      },
      name: {
        label: i18n.t('inventory.labels.name'),
        include: true,
        property: 'inventoryItem.name'
      },
      genericName: {
        label: i18n.t('inventory.labels.genericName'),
        include: true,
        property: 'inventoryItem.genericName'
      },
      transactionType: {
        label: i18n.t('inventory.labels.adjustmentType'),
        include: false,
        property: 'transactionType'
      },
      expenseAccount: {
        label: i18n.t('inventory.labels.expense'),
        include: false,
        property: 'expenseAccount'
      },
      description: {
        label: i18n.t('labels.description'),
        include: false,
        property: 'inventoryItem.description'
      },
      type: {
        label: i18n.t('labels.type'),
        include: true,
        property: 'inventoryItem.inventoryType'
      },
      xref: {
        label: i18n.t('inventory.labels.crossReference'),
        include: false,
        property: 'inventoryItem.crossReference'
      },
      reorder: {
        label: i18n.t('inventory.labels.reorderPoint'),
        include: false,
        property: 'inventoryItem.reorderPoint',
        format: '_numberFormat'
      },
      price: {
        label: i18n.t('inventory.labels.salePricePerUnit'),
        include: false,
        property: 'inventoryItem.price',
        format: '_numberFormat'
      },
      quantity: {
        label: i18n.t('labels.quantity'),
        include: true,
        property: 'quantity',
        format: '_numberFormat'
      },
      consumedPerDay: {
        label: i18n.t('inventory.labels.consumptionRate'),
        include: false,
        property: 'consumedPerDay'
      },
      daysLeft: {
        label: i18n.t('inventory.labels.daysLeft'),
        include: false,
        property: 'daysLeft'
      },
      unit: {
        label: i18n.t('inventory.labels.distributionUnit'),
        include: true,
        property: 'inventoryItem.distributionUnit'
      },
      unitcost: {
        label: i18n.t('inventory.labels.unitCost'),
        include: true,
        property: 'unitCost',
        format: '_numberFormat'
      },
      total: {
        label: i18n.t('inventory.labels.totalCost'),
        include: true,
        property: 'totalCost',
        format: '_numberFormat'
      },
      gift: {
        label: i18n.t('inventory.labels.gift'),
        include: true,
        property: 'giftInKind'
      },
      locations: {
        label: i18n.t('inventory.labels.locations'),
        include: true,
        property: 'locations',
        format: '_addLocationColumn'
      },
      aisle: {
        label: i18n.t('inventory.labels.aisle'),
        include: false,
        property: 'locations',
        format: '_addAisleColumn'
      },
      paymentMethod: {
        label: i18n.t('billing.labels.paymentMethod'),
        include: false,
        property: 'paymentMethod'
      },
      paymentInfo: {
        label: i18n.t('billing.labels.paymentInfo'),
        include: false,
        property: 'paymentInfo'
      },
      vendor: {
        label: i18n.t('inventory.labels.vendor'),
        include: false,
        property: 'vendors'
      }
    };
  }),
  reportTypes: Ember.computed(function() {
    let i18n = this.get('i18n');
    return [{
      name: i18n.t('inventory.reports.daysSupply'),
      value: 'daysLeft'
    }, {
      name: i18n.t('inventory.reports.adjustment'),
      value: 'detailedAdjustment'
    }, {
      name: i18n.t('inventory.reports.purchaseDetail'),
      value: 'detailedPurchase'
    }, {
      name: i18n.t('inventory.reports.stockUsageDetail'),
      value: 'detailedUsage'
    }, {
      name: i18n.t('inventory.reports.stockTransferDetail'),
      value: 'detailedTransfer'
    }, {
      name: i18n.t('inventory.reports.expenseDetail'),
      value: 'detailedExpense'
    }, {
      name: i18n.t('inventory.reports.expiration'),
      value: 'expiration'
    }, {
      name: i18n.t('inventory.reports.invLocation'),
      value: 'byLocation'
    }, {
      name: i18n.t('inventory.reports.invValuation'),
      value: 'valuation'
    }, {
      name: i18n.t('inventory.reports.expenseSum'),
      value: 'summaryExpense'
    }, {
      name: i18n.t('inventory.reports.purchaseSum'),
      value: 'summaryPurchase'
    }, {
      name: i18n.t('inventory.reports.stockUsageSum'),
      value: 'summaryUsage'
    }, {
      name: i18n.t('inventory.reports.stockTransferSum'),
      value: 'summaryTransfer'
    }, {
      name: i18n.t('inventory.reports.finance'),
      value: 'summaryFinance'
    }];
  }),

  hideLocationFilter: function() {
    let reportType = this.get('reportType');
    return (reportType === 'summaryFinance');
  }.property('reportType'),

  includeDate: function() {
    let reportType = this.get('reportType');
    if (!Ember.isEmpty(reportType) && reportType.indexOf('detailed') === 0) {
      this.set('reportColumns.date.include', true);
      return true;
    } else {
      this.set('reportColumns.date.include', false);
      return false;
    }
  }.property('reportType'),

  includePayment: function() {
    let reportType = this.get('reportType');
    if (reportType === 'detailedPurchase') {
      this.set('reportColumns.paymentMethod.include', true);
      this.set('reportColumns.paymentInfo.include', true);
      return true;
    } else {
      this.set('reportColumns.paymentMethod.include', false);
      this.set('reportColumns.paymentInfo.include', false);
      return false;
    }
  }.property('reportType'),

  includeDaysLeft: function() {
    let reportType = this.get('reportType');
    if (reportType === 'daysLeft') {
      this.set('reportColumns.consumedPerDay.include', true);
      this.set('reportColumns.daysLeft.include', true);
      return true;
    } else {
      this.set('reportColumns.consumedPerDay.include', false);
      this.set('reportColumns.daysLeft.include', false);
      return false;
    }

  }.property('reportType'),

  includeCostFields: function() {
    let reportType = this.get('reportType');
    if (reportType === 'detailedTransfer' || reportType === 'summaryTransfer' || reportType === 'daysLeft') {
      this.set('reportColumns.total.include', false);
      this.set('reportColumns.unitcost.include', false);
      return false;
    } else {
      this.set('reportColumns.total.include', true);
      this.set('reportColumns.unitcost.include', true);
      return true;
    }
  }.property('reportType'),

  includeExpenseAccount: function() {
    let reportType = this.get('reportType');
    switch (reportType) {
      case 'detailedAdjustment':
      case 'detailedTransfer':
      case 'detailedUsage': {
        return true;
      }
      case 'detailedExpense': {
        this.set('reportColumns.expenseAccount.include', true);
        return true;
      }
      default: {
        this.set('reportColumns.expenseAccount.include', false);
        return false;
      }
    }
  }.property('reportType'),

  includeTransactionType: function() {
    let reportType = this.get('reportType');
    if (reportType === 'detailedAdjustment') {
      this.set('reportColumns.transactionType.include', true);
      return true;
    } else {
      this.set('reportColumns.transactionType.include', false);
      return false;
    }
  }.property('reportType'),

  showEffectiveDate: function() {
    let reportType = this.get('reportType');
    if (reportType === 'valuation' || reportType === 'byLocation') {
      this.set('startDate', null);
      if (Ember.isEmpty(this.get('endDate'))) {
        this.set('endDate', new Date());
      }
      return true;
    } else {
      if (Ember.isEmpty(this.get('startDate'))) {
        this.set('startDate', new Date());
      }
      return false;
    }
  }.property('reportType'),

  useFieldPicker: function() {
    let reportType = this.get('reportType');
    return (reportType !== 'expiration' && reportType !== 'summaryFinance');
  }.property('reportType'),

  _addAisleColumn(locations) {
    if (!Ember.isEmpty(locations)) {
      return locations.map(function(location) {
        if (location.name.indexOf(':') > -1) {
          return location.name.split(':')[1];
        }
      });
    }
  },

  _addLocationColumn(locations) {
    if (!Ember.isEmpty(locations)) {
      let returnLocations = [];
      locations.forEach(function(location) {
        let formattedName;
        if (location.name.indexOf('From:') === 0) {
          formattedName = location.name;
        } else {
          formattedName = this._getWarehouseLocationName(location.name);
        }
        if (!returnLocations.includes(formattedName)) {
          returnLocations.push(formattedName);
        }
      }.bind(this));
      return returnLocations;
    }
  },

  _addReportRow(row, skipNumberFormatting, reportColumns, rowAction) {
    if (Ember.isEmpty(rowAction) && !Ember.isEmpty(row.inventoryItem) && !Ember.isEmpty(row.inventoryItem.id)) {
      rowAction = {
        action: 'viewInventory',
        model: row.inventoryItem.id
      };
    }
    this._super(row, skipNumberFormatting, reportColumns, rowAction);
  },

  _addTotalsRow(label, summaryCost, summaryQuantity) {
    if (summaryQuantity > 0) {
      this._addReportRow({
        totalCost: label + this._numberFormat(summaryCost),
        quantity: label + this._numberFormat(summaryQuantity),
        unitCost: label + this._numberFormat(summaryCost / summaryQuantity)
      }, true);
    }
  },

  /**
   * Adjust the specified location by the specified quantity
   * @param {array} locations the list of locations to adjust from
   * @param {string} locationName the name of the location to adjust
   * @param {integer} quantity the quantity to adjust.
   * @param {boolean} increment boolean indicating if the adjustment is an increment; or false if decrement.
   */
  _adjustLocation(locations, locationName, quantity, increment) {
    let locationToUpdate = locations.findBy('name', locationName);
    if (Ember.isEmpty(locationToUpdate)) {
      locationToUpdate = {
        name: locationName,
        quantity: 0
      };
      locations.push(locationToUpdate);
    }
    if (increment) {
      locationToUpdate.quantity += quantity;
    } else {
      locationToUpdate.quantity -= quantity;
    }
  },

  /**
   * Adjust the specified purchase by the specified quantity.
   * @param {array} purchases the list of purchases to adjust from.
   * @param {string} purchaseId the id of the purchase to adjust.
   * @param {integer} quantity the quantity to adjust.
   * @param {boolean} increment boolean indicating if the adjustment is an increment; or false if decrement.
   */
  _adjustPurchase(purchases, purchaseId, quantity, increment) {
    let purchaseToAdjust = purchases.findBy('id', purchaseId);
    if (!Ember.isEmpty(purchaseToAdjust)) {
      let { calculatedQuantity } = purchaseToAdjust;
      if (increment) {
        calculatedQuantity += quantity;
      } else {
        calculatedQuantity -= quantity;
      }
      purchaseToAdjust.calculatedQuantity = calculatedQuantity;
    }
  },

  _calculateCosts(inventoryPurchases, row) {
    // Calculate quantity and cost per unit for the row
    if (!Ember.isEmpty(inventoryPurchases)) {
      inventoryPurchases.forEach(function(purchase) {
        let costPerUnit = this._calculateCostPerUnit(purchase);
        let quantity = purchase.calculatedQuantity;
        row.quantity += purchase.calculatedQuantity;
        row.totalCost += (quantity * costPerUnit);
      }.bind(this));
    }
    if (row.totalCost === 0 || row.quantity === 0) {
      row.unitCost = 0;
    } else {
      row.unitCost = (row.totalCost / row.quantity);
    }
    return row;
  },

  _calculateUsage(inventoryPurchases, row) {
    // Calculate quantity and cost per unit for the row
    if (!Ember.isEmpty(inventoryPurchases)) {
      inventoryPurchases.forEach((purchase) => {
        row.quantity -= purchase.calculatedQuantity;
        row.totalCost -= this._purchaseCost(purchase, 'calculatedQuantity');
      });
    }
    if (row.totalCost === 0 || row.quantity === 0) {
      row.unitCost = 0;
    } else {
      row.unitCost = (row.totalCost / row.quantity);
    }
    return row;
  },

  _findInventoryItems(queryParams, view, inventoryList, childName) {
    if (Ember.isEmpty(inventoryList)) {
      inventoryList = {};
    }
    let database = this.get('database');
    return new Ember.RSVP.Promise(function(resolve, reject) {
      database.queryMainDB(queryParams, view).then(function(inventoryChildren) {
        let inventoryKeys = Object.keys(inventoryList);
        let inventoryIds = [];
        if (!Ember.isEmpty(inventoryChildren.rows)) {
          inventoryChildren.rows.forEach(function(child) {
            if (child.doc.inventoryItem && !inventoryKeys.includes(child.doc.inventoryItem)) {
              inventoryIds.push(database.getPouchId(child.doc.inventoryItem, 'inventory'));
              inventoryKeys.push(child.doc.inventoryItem);
            }
          });
        }
        this._getInventoryItems(inventoryIds, inventoryList).then(function(inventoryMap) {
          // Link inventory children to inventory items
          inventoryChildren.rows.forEach(function(child) {
            let childItem = inventoryMap[child.doc.inventoryItem];
            if (!Ember.isEmpty(childItem)) {
              if (childName !== 'purchaseObjects' || childItem.purchases.includes(child.doc.id)) {
                let itemChildren = childItem[childName];
                if (Ember.isEmpty(itemChildren)) {
                  itemChildren = [];
                }
                itemChildren.push(child.doc);
                childItem[childName] = itemChildren;
              }
            }
          });
          resolve(inventoryMap);
        }, reject);
      }.bind(this), reject);
    }.bind(this));
  },

  _findInventoryItemsByPurchase(reportTimes, inventoryMap) {
    return this._findInventoryItems({
      startkey: [reportTimes.startTime, 'invPurchase_'],
      endkey: [reportTimes.endTime, 'invPurchase_\uffff'],
      include_docs: true
    }, 'inventory_purchase_by_date_received', inventoryMap, 'purchaseObjects');
  },

  _findInventoryItemsByRequest(reportTimes, inventoryMap) {
    return this._findInventoryItems({
      startkey: ['Completed', reportTimes.startTime, 'invRequest_'],
      endkey: ['Completed', reportTimes.endTime, 'invRequest_\uffff'],
      include_docs: true
    }, 'inventory_request_by_status', inventoryMap, 'requestObjects');
  },

  _finishExpenseReport(reportType) {
    let expenseCategories = this.get('expenseCategories');
    let expenseMap = this.get('expenseMap');
    let i18n = this.get('i18n');
    expenseCategories.forEach(function(category) {
      let categoryTotal = 0;
      let expenseAccountName, totalLabel;
      this._addReportRow({
        inventoryItem: {
          name: i18n.t('inventory.reports.rows.expensesFor') + category
        }
      });
      expenseMap[category].expenseAccounts.forEach(function(expenseAccount) {
        if (reportType === 'detailedExpense') {
          expenseAccount.reportRows.forEach(function(row) {
            this._addReportRow(row);
          }.bind(this));
        }
        if (Ember.isEmpty(expenseAccount.name)) {
          expenseAccountName = i18n.t('inventory.reports.rows.noAccount');
        } else {
          expenseAccountName = expenseAccount.name;
        }
        totalLabel = i18n.t('inventory.reports.rows.subtotalFor', { category, account: expenseAccountName });
        this._addReportRow({
          totalCost: totalLabel + this._numberFormat(expenseAccount.total)
        }, true);
        categoryTotal += expenseAccount.total;
      }.bind(this));
      totalLabel = i18n.t('inventory.reports.rows.totalFor', { var: category });
      this._addReportRow({
        totalCost: totalLabel + this._numberFormat(categoryTotal)
      }, true);
      this.incrementProperty('grandCost', categoryTotal);
    }.bind(this));
    this._addReportRow({
      totalCost: i18n.t('inventory.reports.rows.total') + this._numberFormat(this.get('grandCost'))
    }, true);
  },

  _finishLocationReport() {
    let currentLocation = '';
    let locationCost = 0;
    let locationSummary = this.get('locationSummary');
    let parentLocation = '';
    let parentCount = 0;
    let i18n = this.get('i18n');
    locationSummary = locationSummary.sortBy('name');
    locationSummary.forEach(function(location) {
      parentLocation = this._getWarehouseLocationName(location.name);
      let label = i18n.t('inventory.reports.rows.totalFor', { var: currentLocation });
      if (currentLocation !== parentLocation) {
        this._addTotalsRow(label, locationCost, parentCount);
        parentCount = 0;
        locationCost = 0;
        currentLocation = parentLocation;
      }
      if (this._includeLocation(parentLocation)) {
        for (let id in location.items) {
          if (location.items[id].quantity > 0) {
            this._addReportRow({
              giftInKind: location.items[id].giftInKind,
              inventoryItem: location.items[id].item,
              quantity: location.items[id].quantity,
              locations: [{
                name: location.name
              }],
              totalCost: location.items[id].totalCost,
              unitCost: location.items[id].unitCost
            });
            parentCount += this._getValidNumber(location.items[id].quantity);
            locationCost += this._getValidNumber(location.items[id].totalCost);
            this.incrementProperty('grandCost', this._getValidNumber(location.items[id].totalCost));
            this.incrementProperty('grandQuantity', this._getValidNumber(location.items[id].quantity));
          }
        }
      }
    }.bind(this));
    if (parentCount > 0) {
      this._addTotalsRow(i18n.t('inventory.reports.rows.totalFor', { var: parentLocation }), locationCost, parentCount);
    }
  },

  _generateExpirationReport() {
    let grandQuantity = 0;
    let database = this.get('database');
    let reportRows = this.get('reportRows');
    let reportTimes = this._getDateQueryParams();
    database.queryMainDB({
      startkey: [reportTimes.startTime, 'invPurchase_'],
      endkey: [reportTimes.endTime, 'invPurchase_\uffff'],
      include_docs: true
    }, 'inventory_purchase_by_expiration_date').then(function(inventoryPurchases) {
      let purchaseDocs = [];
      let inventoryIds = [];

      inventoryPurchases.rows.forEach(function(purchase) {
        if (purchase.doc.currentQuantity > 0 && !Ember.isEmpty(purchase.doc.expirationDate)) {
          purchaseDocs.push(purchase.doc);
          inventoryIds.push(database.getPouchId(purchase.doc.inventoryItem, 'inventory'));
        }
      }.bind(this));
      this._getInventoryItems(inventoryIds).then(function(inventoryMap) {
        let i18n = this.get('i18n');
        purchaseDocs.forEach(function(purchase) {
          let { currentQuantity } = purchase;
          let expirationDate = new Date(purchase.expirationDate);
          let inventoryItem = inventoryMap[purchase.inventoryItem];
          if (inventoryItem && this._includeLocation(purchase.location)) {
            reportRows.addObject([
              inventoryItem.friendlyId,
              inventoryItem.name,
              currentQuantity,
              inventoryItem.distributionUnit,
              moment(expirationDate).format('l'),
              this.formatLocationName(purchase.location, purchase.aisleLocation)
            ]);
            grandQuantity += currentQuantity;
          }
        }.bind(this));
        reportRows.addObject([
          '', '', i18n.t('inventory.reports.rows.total') + grandQuantity, '', ''
        ]);
        this.set('showReportResults', true);
        this.set('reportHeaders',
          [i18n.t('labels.id'), i18n.t('labels.name'), i18n.t('inventory.labels.currentQuantity'), i18n.t('inventory.labels.distributionUnit'), i18n.t('inventory.labels.expirationDate'), i18n.t('inventory.labels.location')]);
        this._generateExport();
        this._setReportTitle();
        this.closeProgressModal();
      }.bind(this));
    }.bind(this));

  },

  _generateFinancialSummaryReport() {
    let reportTimes = this._getDateQueryParams();
    /*
    step 1: find the valuation as of start date,
    meaning that we need to exchange the end date to be the start date and then tabulate the value
    */
    this._calculateBeginningBalance(reportTimes).then(function(beginningBalance) {
      this._generateSummaries(reportTimes).then(function(inventoryAdjustment) {
        let i = this._numberFormat(beginningBalance + inventoryAdjustment);
        let i18n = this.get('i18n');
        if ((beginningBalance + inventoryAdjustment) < 0) {
          this.get('reportRows').addObject([i18n.t('inventory.reports.rows.balanceEnd'), '', `(${i})`]);
        } else {
          this.get('reportRows').addObject([i18n.t('inventory.reports.rows.balanceEnd'), '', i]);
        }
        this.set('showReportResults', true);
        this.set('reportHeaders', [i18n.t('inventory.reports.rows.category'), i18n.t('labels.type'), i18n.t('inventory.labels.total')]);
        this._generateExport();
        this._setReportTitle();
        this.closeProgressModal();
      }.bind(this), function(err) {
        this._notifyReportError(this.get('i18n').t('inventory.reports.rows.errInFinSum') + err);
      }.bind(this));
    }.bind(this));
  },

  _generateSummaries(reportTimes) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      let adjustedValue = 0;
      let i18n = this.get('i18n');
      /*
      cycle through each purchase and request from the beginning of time until startTime
      to determine the total value of inventory as of that date/time.
      */
      this._findInventoryItemsByRequest(reportTimes, {}).then(function(inventoryMap) {
        this._findInventoryItemsByPurchase(reportTimes, inventoryMap).then(function(inventoryMap) {
          let purchaseSummary = {};
          let consumed = {};
          let gikConsumed = {};
          let adjustments = {};
          this.get('adjustmentTypes').forEach(function(adjustmentType) {
            adjustments[adjustmentType.type] = [];
          });
          Object.keys(inventoryMap).forEach(function(key) {
            if (Ember.isEmpty(key) || Ember.isEmpty(inventoryMap[key])) {
              // If the inventory item has been deleted, ignore it.
              return;
            }
            let item = inventoryMap[key];

            if (!Ember.isEmpty(item.purchaseObjects)) {
              item.purchaseObjects.forEach((purchase) => {
                purchaseSummary[item.inventoryType] = this._getValidNumber(purchaseSummary[item.inventoryType])
                  + this._purchaseCost(purchase, 'originalQuantity');
              });
            }
            if (!Ember.isEmpty(item.requestObjects)) {
              item.requestObjects.forEach(function(request) {
                // we have three categories here: consumed, gik consumed, and adjustments
                if (request.adjustPurchases) {
                  if (request.transactionType === 'Fulfillment') {
                    if (request.giftInKind) {
                      gikConsumed[item.inventoryType] = this._getValidNumber(gikConsumed[item.inventoryType]) + (this._getValidNumber(request.quantity * request.costPerUnit));
                    } else {
                      consumed[item.inventoryType] = this._getValidNumber(consumed[item.inventoryType]) + (this._getValidNumber(request.quantity * request.costPerUnit));
                    }
                  } else {
                    adjustments[request.transactionType][item.inventoryType] = this._getValidNumber(adjustments[request.transactionType][item.inventoryType]) + (this._getValidNumber(request.quantity * request.costPerUnit));
                  }
                }
              }.bind(this));
            }
          }.bind(this));
          // write the purchase rows
          if (Object.keys(purchaseSummary).length > 0) {
            let purchaseTotal = 0;
            this.get('reportRows').addObject([i18n.t('inventory.labels.purchases'), '', '']);
            Object.keys(purchaseSummary).forEach(function(key) {
              let i = this._getValidNumber(purchaseSummary[key]);
              purchaseTotal += i;
              this.get('reportRows').addObject(['', key, this._numberFormat(i)]);
            }.bind(this));
            this.get('reportRows').addObject([i18n.t('inventory.reports.rows.totalPurchases'), '', this._numberFormat(purchaseTotal)]);
            adjustedValue += purchaseTotal;
          }
          // write the consumed rows
          if (Object.keys(consumed).length > 0 || Object.keys(gikConsumed).length > 0) {
            this.get('reportRows').addObject([i18n.t('inventory.reports.rows.consumed'), '', '']);
            let overallValue = 0;
            if (Object.keys(consumed).length > 0) {
              this.get('reportRows').addObject([i18n.t('inventory.reports.rows.consumedPuchases'), '', '']);
              let consumedTotal = 0;
              Object.keys(consumed).forEach(function(key) {
                let i = this._getValidNumber(consumed[key]);
                consumedTotal += i;
                this.get('reportRows').addObject(['', key, `(${this._numberFormat(i)})`]);
              }.bind(this));
              overallValue += consumedTotal;
              this.get('reportRows').addObject([i18n.t('inventory.reports.rows.consumedPurchasesTotal'), '', `(${this._numberFormat(consumedTotal)})`]);
            }
            if (Object.keys(gikConsumed).length > 0) {
              this.get('reportRows').addObject([i18n.t('inventory.reports.rows.consumedGik'), '', '']);
              let gikTotal = 0;
              Object.keys(gikConsumed).forEach(function(key) {
                let i = this._getValidNumber(gikConsumed[key]);
                gikTotal += i;
                this.get('reportRows').addObject(['', key, `(${this._numberFormat(i)})`]);
              }.bind(this));
              overallValue += gikTotal;
              this.get('reportRows').addObject([i18n.t('inventory.reports.rows.consumedGikTotal'), '', `(${this._numberFormat(gikTotal)})`]);
            }
            this.get('reportRows').addObject([i18n.t('inventory.reports.rows.consumedTotal'), '', `(${this._numberFormat(overallValue)})`]);
            adjustedValue -= overallValue;
          }
          // write the adjustment rows
          let adjustmentTotal = 0;
          this.get('reportRows').addObject([i18n.t('inventory.reports.rows.adjustments'), '', '']);
          Object.keys(adjustments).forEach(function(adjustmentT) {
            if (Object.keys(adjustments[adjustmentT]).length > 0) {
              this.get('reportRows').addObject([adjustmentT, '', '']);
              Object.keys(adjustments[adjustmentT]).forEach(function(key) {
                let i = this._getValidNumber(adjustments[adjustmentT][key]);
                if (adjustmentT === 'Adjustment (Add)' || adjustmentT === 'Return') {
                  adjustmentTotal += i;
                  this.get('reportRows').addObject(['', key, this._numberFormat(i)]);
                } else {
                  adjustmentTotal -= i;
                  this.get('reportRows').addObject(['', key, `(${this._numberFormat(i)})`]);
                }
              }.bind(this));
            }
          }.bind(this));
          if (adjustmentTotal < 0) {
            this.get('reportRows').addObject([i18n.t('inventory.reports.rows.adjustmentsTotal'), '', `(${this._numberFormat(adjustmentTotal)})`]);
          } else {
            this.get('reportRows').addObject([i18n.t('inventory.reports.rows.adjustmentsTotal'), '', this._numberFormat(adjustmentTotal)]);
          }

          adjustedValue += adjustmentTotal;
          resolve(adjustedValue);
        }.bind(this), reject);
      }.bind(this), reject);
    }.bind(this));
  },

  _calculateBeginningBalance(reportTimes) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      let startingValueReportTimes = {
        startTime: null,
        endTime: reportTimes.startTime
      };
      let beginningBalance = 0;
      let i18n = this.get('i18n');
      /*
      cycle through each purchase and request from the beginning of time until startTime
      to determine the total value of inventory as of that date/time.
      */
      this._findInventoryItemsByRequest(startingValueReportTimes, {}).then(function(inventoryMap) {
        this._findInventoryItemsByPurchase(startingValueReportTimes, inventoryMap).then(function(inventoryMap) {
          Object.keys(inventoryMap).forEach(function(key) {
            if (Ember.isEmpty(key) || Ember.isEmpty(inventoryMap[key])) {
              // If the inventory item has been deleted, ignore it.
              return;
            }
            let item = inventoryMap[key];
            let inventoryPurchases = item.purchaseObjects;
            let inventoryRequests = item.requestObjects;
            let row = {
              inventoryItem: item,
              quantity: 0,
              unitCost: 0,
              totalCost: 0
            };
            if (!Ember.isEmpty(inventoryPurchases)) {
              // Setup intial locations for an inventory item
              inventoryPurchases.forEach(function(purchase) {
                let purchaseQuantity = purchase.originalQuantity;
                purchase.calculatedQuantity = purchaseQuantity;
              });
            }
            if (!Ember.isEmpty(inventoryRequests)) {
              inventoryRequests.forEach(function(request) {
                let { adjustPurchases } = request;
                let increment = false;
                let purchases = request.purchasesAffected;
                let { transactionType } = request;
                increment = (transactionType === 'Adjustment (Add)' || transactionType === 'Return');
                if (adjustPurchases) {
                  if (!Ember.isEmpty(purchases) && !Ember.isEmpty(inventoryPurchases)) {
                    // Loop through purchase(s) on request and adjust corresponding inventory purchases
                    purchases.forEach(function(purchaseInfo) {
                      this._adjustPurchase(inventoryPurchases, purchaseInfo.id, purchaseInfo.quantity, increment);
                    }.bind(this));
                  }
                }
              }.bind(this));
            }
            if (!Ember.isEmpty(inventoryPurchases)) {
              row = this._calculateCosts(inventoryPurchases, row);
              beginningBalance += this._getValidNumber(row.totalCost);
            }
          }.bind(this));
          if (beginningBalance < 0) {
            this.get('reportRows').addObject([i18n.t('inventory.reports.rows.balanceBegin'), '', `(${this._numberFormat(beginningBalance)})`]);
          } else {
            this.get('reportRows').addObject([i18n.t('inventory.reports.rows.balanceBegin'), '', this._numberFormat(beginningBalance)]);
          }
          resolve(beginningBalance);
        }.bind(this), reject);
      }.bind(this), reject);
    }.bind(this));
  },

  _preprocessRequest({ locations }, purchases, request) {
    let {
      adjustPurchases,
      deliveryLocation,
      deliveryAisle,
      locationsAffected,
      purchasesAffected,
      quantity,
      transactionType
    } = request;
    let increment = (
      transactionType === 'Adjustment (Add)'
      || transactionType === 'Return'
    );

    if (adjustPurchases && !Ember.isEmpty(purchasesAffected) && !Ember.isEmpty(purchases)) {
      purchasesAffected.forEach(({ id, quantity }) =>
        this._adjustPurchase(purchases, id, quantity, increment));
    } else if (transactionType === 'Transfer') {
      let locationName = this.getDisplayLocationName(deliveryLocation, deliveryAisle);
      this._adjustLocation(locations, locationName, quantity, true);
    }

    locationsAffected.forEach(({ name, quantity }) =>
      this._adjustLocation(locations, name, quantity, increment));
  },

  _preprocessPurchase(row, purchase) {
    if (purchase.giftInKind === true) {
      row.giftInKind = 'Y';
    }
    if (!Ember.isEmpty(purchase.vendor)) {
      if (!row.vendors.includes(purchase.vendor)) {
        row.vendors.push(purchase.vendor);
      }
    }
    purchase.calculatedQuantity = purchase.originalQuantity;
    let locationName = this.getDisplayLocationName(purchase.location, purchase.aisleLocation);
    this._adjustLocation(row.locations, locationName, purchase.originalQuantity, true);
  },

  _byLocationReport({ locations, giftInKind }, item, purchases) {
    let locationSummary = [];
    locations.forEach((location) => {
      let { quantity, name } = location;
      let locationToUpdate = locationSummary.findBy('name', this._getWarehouseLocationName(name));
      if (Ember.isEmpty(locationToUpdate)) {
        locationToUpdate = Ember.copy(location);
        locationToUpdate.items = {};
        locationSummary.push(locationToUpdate);
      } else {
        locationToUpdate.quantity += this._getValidNumber(quantity);
      }
      let { unitCost } = this._calculateCosts(purchases, {
        quantity: 0,
        totalCost: 0
      });
      locationToUpdate.items[item.id] = {
        item,
        quantity: this._getValidNumber(quantity),
        giftInKind,
        totalCost: (this._getValidNumber(unitCost) * this._getValidNumber(quantity)),
        unitCost: this._getValidNumber(unitCost)
      };
    });
  },

  _daysLeftReport(row, item, requests) {
    let dateDiff = moment(this.get('endDate')).diff(this.get('startDate'), 'days');
    if (!Ember.isEmpty(requests) && this._hasIncludedLocation(row.locations)) {
      let consumedQuantity = requests.reduce(
        (qty, { transactionType, quantity }) =>
          transactionType === 'Fulfillment' ? qty += this._getValidNumber(quantity) : qty
        , 0);
      row.quantity = this._getValidNumber(item.quantity);
      if (consumedQuantity > 0) {
        row.consumedPerDay = this._numberFormat(consumedQuantity / dateDiff, true);
        row.daysLeft = this._numberFormat(row.quantity / row.consumedPerDay);
      } else if (consumedQuantity === 0) {
        row.consumedPerDay = '0';
        row.daysLeft = '?';
      } else {
        row.consumedPerDay = `?${consumedQuantity}`;
        row.daysLeft = '?';
      }
      this._addReportRow(row);
    }
  },

  _generalReport({ giftInKind, inventoryItem }, reportType, requests) {
    let summaryQuantity = 0;
    let summaryCost = 0;
    let i18n = this.get('i18n');
    if (!Ember.isEmpty(requests)) {
      requests.forEach((request) => {
        if (this._includeTransaction(reportType, request.transactionType)
            && this._hasIncludedLocation(request.locationsAffected)) {
          let deliveryLocation = this.getDisplayLocationName(request.deliveryLocation, request.deliveryAisle);
          let locations = request.locationsAffected.map((location) => {
            if (reportType === 'detailedTransfer') {
              return {
                name: i18n.t('inventory.reports.rows.transfer2', {
                  source: location.name,
                  target: deliveryLocation
                }).toString()
              };
            } else {
              return {
                name: i18n.t('inventory.reports.rows.transfer1', {
                  quantity: this._getValidNumber(request.quantity),
                  location: location.name
                }).toString()
              };
            }
          });
          let reportRow = {
            date: moment(new Date(request.dateCompleted)).format('l'),
            expenseAccount: request.expenseAccount,
            giftInKind,
            inventoryItem,
            quantity: request.quantity,
            transactionType: request.transactionType,
            locations,
            unitCost: request.costPerUnit,
            totalCost: this._getValidNumber(request.quantity) * this._getValidNumber(request.costPerUnit)
          };
          if (reportType === 'detailedExpense' || reportType === 'summaryExpense') {
            this._updateExpenseMap(request, reportRow);
          } else {
            this._addReportRow(reportRow);
            summaryQuantity += this._getValidNumber(request.quantity);
            summaryCost += this._getValidNumber(reportRow.totalCost);
          }
        }
      });
      if (reportType !== 'detailedExpense' && reportType !== 'summaryExpense') {
        this._addTotalsRow(i18n.t('inventory.reports.rows.subtotal'), summaryCost, summaryQuantity);
      }
    }
    return [summaryCost, summaryQuantity];
  },

  _summaryReport(row, reportType, requests) {
    let summaryQuantity = 0;
    let summaryCost = 0;
    if (!Ember.isEmpty(requests) && this._hasIncludedLocation(row.locations)) {
      row.quantity = requests.reduce((qty, request) => {
        if (this._includeTransaction(reportType, request.transactionType)) {
          summaryCost += this._getValidNumber(request.quantity) * this._getValidNumber(request.costPerUnit);
          return qty += this._getValidNumber(request.quantity);
        } else {
          return qty;
        }
      }, 0);
      summaryQuantity = row.quantity;
      if (row.quantity > 0) {
        row.totalCost = summaryCost;
        row.unitCost = (summaryCost / row.quantity);
        this._addReportRow(row);
      }
    }
    return [summaryCost, summaryQuantity];
  },

  _detailedPurchaseReport({ inventoryItem }, purchases) {
    let summaryQuantity = 0;
    let summaryCost = 0;
    if (!Ember.isEmpty(purchases)) {
      purchases.forEach((purchase) => {
        if (this._includeLocation(purchase.location)) {
          this._addReportRow({
            date: moment(new Date(purchase.dateReceived)).format('l'),
            giftInKind: purchase.giftInKind === true ? 'Y' : 'N',
            inventoryItem,
            quantity: purchase.originalQuantity,
            unitCost: purchase.costPerUnit,
            paymentMethod: purchase.paymentMethod,
            paymentInfo: purchase.paymentInfo,
            totalCost: this._purchaseCost(purchase, 'originalQuantity'),
            locations: [{
              name: this.getDisplayLocationName(purchase.location, purchase.aisleLocation)
            }]
          });
          summaryCost += this._purchaseCost(purchase, 'originalQuantity');
          summaryQuantity += this._getValidNumber(purchase.originalQuantity);
        }
      });
      this._addTotalsRow(this.get('i18n').t('inventory.reports.rows.subtotal'), summaryCost, summaryQuantity);
    }
    return [summaryCost, summaryQuantity];
  },

  _summaryPurchaseReport(row, purchases) {
    let summaryQuantity = 0;
    let summaryCost = 0;
    if (!Ember.isEmpty(purchases)) {
      row.locations = [];
      row.quantity = purchases.reduce((qty, purchase) => {
        summaryCost += this._purchaseCost(purchase, 'originalQuantity');
        let locationName = this.getDisplayLocationName(purchase.location, purchase.aisleLocation);
        if (!row.locations.findBy('name', locationName)) {
          row.locations.push({
            name: this.getDisplayLocationName(purchase.location, purchase.aisleLocation)
          });
        }
        return qty += this._getValidNumber(purchase.originalQuantity);
      }, 0);
      summaryQuantity = row.quantity;
      if (this._hasIncludedLocation(row.locations)) {
        row.unitCost = (summaryCost / row.quantity);
        row.totalCost = summaryCost;
        this._addReportRow(row);
      }
    }
    return [summaryCost, summaryQuantity];
  },

  _valuationReport(row, purchases) {
    let summaryQuantity = 0;
    let summaryCost = 0;
    if (!Ember.isEmpty(purchases) && this._hasIncludedLocation(row.locations)) {
      this._calculateCosts(purchases, row);
      summaryCost = row.totalCost;
      summaryQuantity = row.quantity;
      this._addReportRow(row);
    }
    return [summaryCost, summaryQuantity];
  },

  _genInventoryData(queryParams) {
    let errorLabel = this.get('i18n').t('inventory.reports.rows.errInFindPur');
    let onError = (err) => {
      this._notifyReportError(errorLabel + err);
    };

    return this._findInventoryItemsByRequest(queryParams, {}).then((inventory) => {
      return this._findInventoryItemsByPurchase(queryParams, inventory).then((inventory) => {
        let cleanInventory = Object.keys(inventory)
          .filter((k) => !Ember.isEmpty(inventory[k]))
          .map((k) => inventory[k]);
        let [meds, others] = funk.splitBy(cleanInventory, (i) => Ember.isEmpty(Ember.get(i, 'genericName')));
        let genericGroup = funk.groupBy(meds, 'genericName');
        let medGroups = Object.keys(genericGroup).map((g) => genericGroup[g]);
        return [medGroups, others];
      }, onError);
    }, onError);
  },

  _genMedReport(reportType, meds) {
    let genericCost = 0;
    let genericQuantity = 0;
    let genericName = Ember.get(meds[0], 'genericName');
    meds.forEach((med) => {
      let [cost, units] = this._genItemReport(reportType, med);
      genericCost += cost;
      genericQuantity += units;
    });
    if (genericQuantity !== 0 && genericCost !== 0) {
      this._addTotalsRow(
        this.get('i18n').t('inventory.reports.rows.genericSubtotal', { genericName }),
        genericCost, genericQuantity);
    }
    return [genericCost, genericQuantity];
  },

  _genItemReport(reportType, item) {
    let {
      purchaseObjects: purchases,
      requestObjects: requests
    } = item;

    let row = {
      giftInKind: 'N',
      inventoryItem: item,
      quantity: 0,
      unitCost: 0,
      totalCost: 0,
      locations: [],
      vendors: []
    };

    if (!Ember.isEmpty(purchases)) {
      purchases.forEach((purchase) => this._preprocessPurchase(row, purchase));
    }
    if (!Ember.isEmpty(requests)) {
      requests.forEach((request) => this._preprocessRequest(row, purchases, request));
    }

    let totals = [0, 0];

    switch (reportType) {
      case 'byLocation': {
        this._byLocationReport(row, item, purchases);
        break;
      }
      case 'daysLeft': {
        this._daysLeftReport(row, item, requests);
        break;
      }
      case 'detailedAdjustment':
      case 'detailedTransfer':
      case 'detailedUsage':
      case 'detailedExpense':
      case 'summaryExpense': {
        totals = this._generalReport(row, reportType, requests);
        break;
      }
      case 'summaryTransfer':
      case 'summaryUsage': {
        totals = this._summaryReport(row, reportType, requests);
        break;
      }
      case 'detailedPurchase': {
        totals = this._detailedPurchaseReport(row, purchases);
        break;
      }
      case 'summaryPurchase': {
        totals = this._summaryPurchaseReport(row, purchases);
        break;
      }
      case 'valuation': {
        totals = this._valuationReport(row, purchases);
        break;
      }
    }
    return totals;
  },

  _generateInventoryReport() {
    // initial reset
    this.set('grandCost', 0);
    this.set('grandQuantity', 0);
    this.set('locationSummary', []);

    let i18n = this.get('i18n');
    let reportType = this.get('reportType');

    // Optimization: Prevent Query for daysLeft report if params
    // don't exist
    if (reportType === 'daysLeft'
        && Ember.isEmpty(this.get('endDate'))
        || Ember.isEmpty(this.get('startDate'))) {
      this.closeProgressModal();
      return;
    }

    this._genInventoryData(this._getDateQueryParams()).then(([medGroups, others]) => {
      let medTotals = medGroups.map((item) => this._genMedReport(reportType, item));
      let otherTotals = others.map((item) => this._genItemReport(reportType, item));
      medTotals.forEach(([cost, units]) => {
        this.incrementProperty('grandCost', cost);
        this.incrementProperty('grandQuantity', units);
      });
      otherTotals.forEach(([cost, units]) => {
        this.incrementProperty('grandCost', cost);
        this.incrementProperty('grandQuantity', units);
      });
      // finish
      switch (reportType) {
        case 'detailedExpense':
        case 'summaryExpense': {
          this._finishExpenseReport(reportType);
          break;
        }
        case 'byLocation': {
          this._finishLocationReport();
          this._addTotalsRow(i18n.t('inventory.reports.rows.total'), this.get('grandCost'), this.get('grandQuantity'));
          break;
        }
        default: {
          this._addTotalsRow(i18n.t('inventory.reports.rows.total'), this.get('grandCost'), this.get('grandQuantity'));
        }
      }
      this._finishReport();
      this.closeProgressModal();
    }).catch((err) => {
      console.error(err);
      this.closeProgressModal();
    });
  },

  _getDateQueryParams() {
    let endDate = this.get('endDate');
    let endTime = this.get('maxValue');
    let startDate = this.get('startDate');
    let startTime;
    if (!Ember.isEmpty(endDate)) {
      endTime = moment(endDate).endOf('day').toDate().getTime();
    }
    if (!Ember.isEmpty(startDate)) {
      startTime = moment(startDate).startOf('day').toDate().getTime();
    }
    return {
      endTime,
      startTime
    };
  },

  _getInventoryItems(inventoryIds, inventoryMap) {
    let database = this.get('database');
    return new Ember.RSVP.Promise(function(resolve, reject) {
      if (Ember.isEmpty(inventoryMap)) {
        inventoryMap = {};
      }
      database.queryMainDB({
        keys: inventoryIds,
        include_docs: true
      }).then(function(inventoryItems) {
        inventoryItems.rows.forEach(function(inventoryItem) {
          if (inventoryItem.doc && inventoryItem.doc.archived !== true) {
            inventoryMap[inventoryItem.doc.id] = inventoryItem.doc;
          }
        });
        resolve(inventoryMap);
      }, reject);
    });
  },

  /**
   * Pull the warehouse name out of a formatted location name that (may) include the aisle location
   * @param {string} locationName the formatted location name.
   * @return {string} the warehouse name.
   */
  _getWarehouseLocationName(locationName) {
    let returnLocation = '';
    if (locationName.indexOf(':') > -1) {
      returnLocation = locationName.split(':')[0].trim();
    } else {
      returnLocation = locationName;
    }
    return returnLocation;
  },

  /**
   * Determines if any of the passed in location objects match the currently filtered location
   * @param {array} locations list of location objects to check.
   * @return {boolean} true if any of the locations match the filter; otherwise false.
   */
  _hasIncludedLocation(locations) {
    let hasIncludedLocation = false;
    locations.forEach(function(location) {
      let locationName = this._getWarehouseLocationName(location.name);
      if (this._includeLocation(locationName)) {
        hasIncludedLocation = true;
      }
    }.bind(this));
    return hasIncludedLocation;
  },

  /**
   * Determine if the specified location should be included in the report
   * @param {string} location the location to check for inclusion
   * @return {boolean} true if the location should be included.
   */
  _includeLocation(location) {
    let filterLocation = this.get('filterLocation');
    return Ember.isEmpty(filterLocation) || location === filterLocation;
  },

  /**
   * Given a report type and a transaction type determine if the transaction should
   * be included in the report.
   * @param {string} reportType the report type
   * @param {string} transactionType the transaction type
   * @return {boolean} true if the transaction should be included.
   */
  _includeTransaction(reportType, transactionType) {
    let detailed = (reportType.indexOf('detailed') === 0);
    let includeForReportType;
    if (reportType === 'detailedExpense' || reportType === 'summaryExpense') {
      return true;
    }
    switch (transactionType) {
      case 'Fulfillment': {
        if (detailed) {
          includeForReportType = 'detailedUsage';
        } else {
          includeForReportType = 'summaryUsage';
        }
        break;
      }
      case 'Transfer': {
        if (detailed) {
          includeForReportType = 'detailedTransfer';
        } else {
          includeForReportType = 'summaryTransfer';
        }
        break;
      }
      default: {
        if (detailed) {
          includeForReportType = 'detailedAdjustment';
        } else {
          includeForReportType = 'summaryAdjustment';
        }
      }
    }
    return (reportType === includeForReportType);
  },

  _updateExpenseMap(request, reportRow) {
    let categoryToUpdate;
    let expenseMap = this.get('expenseMap');
    let isGiftInKind = (reportRow.giftInKind === 'Y');
    let increment = true;

    switch (request.transactionType) {
      case 'Fulfillment':
      case 'Return': {
        if (isGiftInKind) {
          categoryToUpdate = expenseMap['Gift In Kind Usage'];
        } else {
          categoryToUpdate = expenseMap['Inventory Consumed'];
        }
        if (request.transactionType === 'Return') {
          increment = false;
        }
        break;

      }
      case 'Adjustment (Add)':
      case 'Adjustment (Remove)':
      case 'Return To Vendor':
      case 'Write Off': {
        categoryToUpdate = expenseMap['Inventory Obsolence'];
        if (request.transactionType === 'Adjustment (Add)') {
          increment = false;
        }
        break;
      }
    }
    if (!Ember.isEmpty(categoryToUpdate)) {
      let expenseAccountToUpdate = categoryToUpdate.expenseAccounts.findBy('name', request.expenseAccount);
      if (Ember.isEmpty(expenseAccountToUpdate)) {
        expenseAccountToUpdate = {
          name: request.expenseAccount,
          total: 0,
          reportRows: []
        };
        categoryToUpdate.expenseAccounts.push(expenseAccountToUpdate);
      }
      expenseAccountToUpdate.reportRows.push(reportRow);
      let transactionValue = (this._getValidNumber(request.quantity) * this._getValidNumber(request.costPerUnit));
      if (increment) {
        categoryToUpdate.total += transactionValue;
        expenseAccountToUpdate.total += transactionValue;
      } else {
        categoryToUpdate.total = categoryToUpdate.total - transactionValue;
        expenseAccountToUpdate.total = expenseAccountToUpdate.total - transactionValue;
        reportRow.totalCost = (reportRow.totalCost * -1);
      }

    }
  },

  actions: {
    generateReport() {
      let endDate = this.get('endDate');
      let reportRows = this.get('reportRows');
      let reportType = this.get('reportType');
      let startDate = this.get('startDate');
      if (Ember.isEmpty(startDate) && Ember.isEmpty(endDate)) {
        return;
      }
      reportRows.clear();
      this.showProgressModal();
      switch (reportType) {
        case 'expiration': {
          this._generateExpirationReport();
          break;
        }
        case 'summaryFinance': {
          this._generateFinancialSummaryReport();
          break;
        }
        case 'detailedExpense':
        case 'summaryExpense': {
          let expenseCategories = this.get('expenseCategories');
          let expenseMap = {};
          expenseCategories.forEach(function(category) {
            expenseMap[category] = {
              total: 0,
              expenseAccounts: []
            };
          });
          this.set('expenseMap', expenseMap);
          this._generateInventoryReport();
          break;
        }
        default: {
          this._generateInventoryReport();
          break;
        }
      }
    },

    viewInventory(id) {
      this.store.find('inventory', id).then(function(item) {
        item.set('returnTo', 'inventory.reports');
        this.transitionToRoute('inventory.edit', item);
      }.bind(this));
    }
  }
});
