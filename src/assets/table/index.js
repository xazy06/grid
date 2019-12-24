(function () {
  const numbersDeclaration = function numbersDeclaration(number, titles) {
    var cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
  };

  Number.prototype.isInt = function (){
    return (Math.round(this) === this);
  };

  Number.prototype.roundTo = function (n){
    var x = 0;
    if (typeof (n) == 'number')
      if (n.isInt())
        if (n >= -6 && n <= 6) x = n;
    x = Math.pow(10, x);
    return Math.round(this * x) / x;
  };

  Number.prototype.toFloatStr = function (n, triads) {
    var s, d = 0, k, m;

    if (typeof (n) == 'number')
      if (n.isInt())
        if (n >= -6 && n <= 6) d = n;

    s = this.roundTo(d).toString().replace('.', ',');

    if (d > 0) {
      k = s.indexOf(',');
      if (k === -1)
        s += ',' + '0'.repeat(d);
      else
        s += '0'.repeat(d - (s.length - k - 1));
    }

    k = s.indexOf(',');
    if (k === -1) k = s.length;
    m = s.indexOf('-');
    if (m === -1)
      m = 0;
    else
      m = 1;

    if (triads)
      for (d = k - 3; d > m; d = d - 3) {
        s = s.substr(0, d) + ' ' + s.substr(d, s.length - d + 1);
      }

    return s;
  };

  window.Grid = (function () {
    var compare, pureComputed;

    pureComputed = ko.pureComputed || ko.computed;

    compare = function (item1, item2) {
      if (item2 == null) {
        return item1 == null;
      } else if (item1 != null) {
        if (typeof item1 === 'boolean') {
          return item1 === item2;
        } else {
          return item1.toString().toLowerCase().indexOf(item2.toString().toLowerCase()) >= 0 || item1 === item2;
        }
      } else {
        return false;
      }
    };

    function Grid(rows, options) {
      if (!options) {
        if (!(rows instanceof Array)) {
          options = rows;
          rows = [];
        } else {
          options = {};
        }
      }
      this.options = {
        record: options.record || 'элемент',
        recordPlural: options.recordPlural,
        recordPlural2: options.recordPlural2,
        sortDirection: options.sortDirection || 'asc',
        sortField: options.sortField || void 0,
        perPage: options.perPage || 50,
        unsortedClass: options.unsortedClass || '',
        descSortClass: options.descSortClass || '',
        ascSortClass: options.ascSortClass || ''
      };

      this.initObservables();

      this.init(rows);
    }

    Grid.prototype.initObservables = function () {
      this.sortDirection = ko.observable(this.options.sortDirection);
      this.sortField = ko.observable(this.options.sortField);
      this.perPage = ko.observable(this.options.perPage);
      this.currentPage = ko.observable(1);
      this.filter = ko.observable('');
      this.loading = ko.observable(false);
      return this.rows = ko.observableArray([]);
    };

    Grid.prototype.init = function (rows) {
      var _defaultMatch;
      this.filtering = ko.observable(false);
      this.filter.subscribe((function (_this) {
        return function () {
          return _this.currentPage(1);
        };
      })(this));
      this.perPage.subscribe((function (_this) {
        return function () {
          return _this.currentPage(1);
        };
      })(this));
      this.rows(rows);
      this.rowAttributeMap = pureComputed((function (_this) {
        return function () {
          var attrMap, key, row;
          rows = _this.rows();
          attrMap = {};
          if (rows.length > 0) {
            row = rows[0];
            for (key in row) {
              if (row.hasOwnProperty(key)) {
                attrMap[key.toLowerCase()] = key;
              }
            }
          }
          return attrMap;
        };
      })(this));
      this.filteredRows = pureComputed((function (_this) {
        return function () {
          var filter, filterFn;
          _this.filtering(true);
          filter = _this.filter();
          rows = _this.rows.slice(0);
          if ((filter != null) && filter !== '') {
            filterFn = _this.filterFn(filter);
            rows = rows.filter(filterFn);
          }
          if ((_this.sortField() != null) && _this.sortField() !== '') {
            rows.sort(function (a, b) {
              var aVal, bVal;
              aVal = ko.utils.peekObservable(a[_this.sortField()]);
              bVal = ko.utils.peekObservable(b[_this.sortField()]);
              if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
              }
              if (typeof bVal === 'string') {
                bVal = bVal.toLowerCase();
              }
              if (_this.sortDirection() === 'asc') {
                if (aVal < bVal || aVal === '' || (aVal == null)) {
                  return -1;
                } else {
                  if (aVal > bVal || bVal === '' || (bVal == null)) {
                    return 1;
                  } else {
                    return 0;
                  }
                }
              } else {
                if (aVal < bVal || aVal === '' || (aVal == null)) {
                  return 1;
                } else {
                  if (aVal > bVal || bVal === '' || (bVal == null)) {
                    return -1;
                  } else {
                    return 0;
                  }
                }
              }
            });
          } else {
            rows;
          }
          _this.filtering(false);
          return rows;
        };
      })(this)).extend({
        rateLimit: 50,
        method: 'notifyWhenChangesStop'
      });
      this.pagedRows = pureComputed((function (_this) {
        return function () {
          var pageIndex, perPage;
          pageIndex = _this.currentPage() - 1;
          perPage = _this.perPage();
          return _this.filteredRows().slice(pageIndex * perPage, (pageIndex + 1) * perPage);
        };
      })(this));
      this.pages = pureComputed((function (_this) {
        return function () {
          return Math.ceil(_this.filteredRows().length / _this.perPage());
        };
      })(this));
      this.leftPagerClass = pureComputed((function (_this) {
        return function () {
          if (_this.currentPage() === 1) {
            return 'disabled';
          }
        };
      })(this));
      this.rightPagerClass = pureComputed((function (_this) {
        return function () {
          if (_this.currentPage() === _this.pages()) {
            return 'disabled';
          }
        };
      })(this));
      this.total = pureComputed((function (_this) {
        return function () {
          return _this.filteredRows().length;
        };
      })(this));
      this.from = pureComputed((function (_this) {
        return function () {
          return (_this.currentPage() - 1) * _this.perPage() + 1;
        };
      })(this));
      this.to = pureComputed((function (_this) {
        return function () {
          var to;
          to = _this.currentPage() * _this.perPage();
          if (to > _this.total()) {
            return _this.total();
          } else {
            return to;
          }
        };
      })(this));
      this.recordsLabel = pureComputed((function (_this) {
        return function () {
          var from, pages, record, recordPlural, to, total;
          pages = _this.pages();
          total = _this.total();
          from = _this.from();
          to = _this.to();
          record = _this.options.record;
          recordPlural = _this.options.recordPlural || record;
          recordPlural2 = _this.options.recordPlural2 || record;
          if (pages > 1) {
            return from + " - " + to + " из " + total.toFloatStr(0, true) + " " + numbersDeclaration(total, [record, recordPlural, recordPlural2]);
          } else {
            return total + " " + (numbersDeclaration(total, [record, recordPlural, recordPlural2]));
          }
        };
      })(this));
      this.showNoData = pureComputed((function (_this) {
        return function () {
          return _this.pagedRows().length === 0 && !_this.loading();
        };
      })(this));
      this.showLoading = pureComputed((function (_this) {
        return function () {
          return _this.loading();
        };
      })(this));
      this.sortClass = (function (_this) {
        return function (column) {
          return pureComputed(function () {
            if (_this.sortField() === column) {
              return 'sorted ' + (_this.sortDirection() === 'asc' ? _this.options.ascSortClass : _this.options.descSortClass);
            } else {
              return _this.options.unsortedClass;
            }
          });
        };
      })(this);
      _defaultMatch = function (filter, row, attrMap) {
        var key, val;
        return ((function () {
          var results1 = [];

          for (key in attrMap) {
            val = attrMap[key];
            results1.push(val);
          }
          return results1;
        })()).some(function (val) {
          return compare((ko.isObservable(row[val]) ? row[val]() : row[val]), filter);
        });
      };
      return this.filterFn = (function (_this) {
        return function (filter_text) {
          var filter, filterVar, ref, specials;
          filterVar = filter_text == null ? "" : filter_text;
          ref = [[], {}], filter = ref[0], specials = ref[1];
          filterVar.split(' ').forEach(function (word) {
            var words;
            if (word.indexOf(':') >= 0) {
              words = word.split(':');
              return specials[words[0]] = (function () {
                switch (words[1].toLowerCase()) {
                  case 'yes':
                  case 'true':
                    return true;
                  case 'no':
                  case 'false':
                    return false;
                  case 'blank':
                  case 'none':
                  case 'null':
                  case 'undefined':
                    return void 0;
                  default:
                    return words[1].toLowerCase();
                }
              })();
            } else {
              return filter.push(word);
            }
          });
          filter = filter.join(' ');
          return function (row) {
            var conditionals, key, val;
            conditionals = (function () {
              var results1;
              results1 = [];
              for (key in specials) {
                val = specials[key];
                results1.push((function (_this) {
                  return function (key, val) {
                    var rowAttr;
                    if (rowAttr = _this.rowAttributeMap()[key.toLowerCase()]) {
                      return compare((ko.isObservable(row[rowAttr]) ? row[rowAttr]() : row[rowAttr]), val);
                    } else {
                      return false;
                    }
                  };
                })(this)(key, val));
              }
              return results1;
            }).call(_this);
            return ([].indexOf.call(conditionals, false) < 0) && (row.match != null ? row.match(filter) : _defaultMatch(filter, row, _this.rowAttributeMap()));
          };
        };
      })(this);
    };

    Grid.prototype.toggleSorting = function (field) {
      return (function (_this) {
        return function () {
          _this.currentPage(1);
          if (_this.sortField() === field) {
            return _this.sortDirection(_this.sortDirection() === 'asc' ? 'desc' : 'asc');
          } else {
            _this.sortDirection(_this.options.sortDirection);
            return _this.sortField(field);
          }
        };
      })(this);
    };

    Grid.prototype.prev = function () {
      var page;
      page = this.currentPage();
      if (page !== 1) {
        return this.currentPage(page - 1);
      }
    };

    Grid.prototype.next = function () {
      var page;
      page = this.currentPage();
      if (page !== this.pages()) {
        return this.currentPage(page + 1);
      }
    };

    Grid.prototype.gotoPage = function (page) {
      return (function (_this) {
        return function () {
          return _this.currentPage(page);
        };
      })(this);
    };

    Grid.prototype.pageClass = function (page) {
      return pureComputed((function (_this) {
        return function () {
          if (_this.currentPage() === page) {
            return 'active';
          }
        };
      })(this));
    };

    return Grid;

  })();

}).call(this);
