var CveController = function CveController() {
  var controller = this;

  this.api = {
    low: 'http://www.filltext.com/?rows=32&id={number|1000}&firstName={firstName}&lastName={lastName}&email={email}&phone={phone|(xxx)xxx-xx-xx}&adress={addressObject}&description={lorem|32}',
    high: 'http://www.filltext.com/?rows=1000&id={number|1000}&firstName={firstName}&delay=3&lastName={lastName}&email={email}&phone={phone|(xxx)xxx-xx-xx}&adress={addressObject}&description={lorem|32}'
  };

  this.viewModel = {};

  this.http = function (url, type, data) {
    var config = {
      method: type || 'GET',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      }
    };

    if (data !== undefined) {
      config.body = JSON.stringify(data)
    }

    return fetch(url, config).then(response => response.json());
  };

  this.fetch = function (url) {
    controller.viewModel.table.loading(true);

    controller.http(url || controller.api.low).then((response) => {
      controller.viewModel.table.rows(response.map((row) => {
        return new Model(controller.viewModel, row);
      }));

      controller.viewModel.table.loading(false);
    })
  };

  this.init = function () {
    controller.viewModel = new ViewModel();
    controller.fetch();
    return controller;
  };

  return controller;

}, controller = new CveController(), Model, ViewModel;

Model = (function () {
  function Model(view, row) {
    row = row || {};

    if (view) {
      this.view = view;
    }

    this.id = row.id;
    this.firstName = ko.observable(row.firstName);
    this.lastName = ko.observable(row.lastName);
    this.email = row.email;
    this.phone = row.phone;
    this.adress = ko.observable(row.adress);
    this.description = ko.observable(row.description);
  }

  return Model;
})();

ViewModel = (function () {
  function ViewModel() {
    var rows = [], options, _this = this;

    options = {
      record: 'запись',
      recordPlural: 'записи',
      recordPlural2: 'записей',
      sortDirection: 'asc',
      sortField: 'id',
      perPage: 50,
      unsortedClass: "fa fa-sort",
      ascSortClass: "fa fa-sort-asc",
      descSortClass: "fa fa-sort-desc"
    };

    this.table = new Grid(rows, options);
    this.selectedItem = new Model(undefined, {});
    this.selectedItemExist = ko.observable(false);
    this.fetchingType = ko.observable('low');

    this.actions = {
      edit: function () {
        var item = this;

        if(item.id !== 101) {
          return
        }

        ko.mapping.fromJS(ko.toJS(new Model(undefined, ko.toJS(item))), {}, _this.selectedItem);
        _this.selectedItemExist(true);
      },
      fetch: function (type) {
        _this.selectedItemExist(false);
        controller.fetch(controller.api[type])
      }
    };

    this.fetchingType.subscribe(function (val) {
      _this.actions.fetch(val);
    });

    ko.applyBindings(this, document.getElementById("app"));
  }

  return ViewModel;
})();

controller.init();
