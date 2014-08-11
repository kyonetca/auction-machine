// Generated by CoffeeScript 1.7.1
(function() {
  (function($) {
    var AuctionSocket, BID_EL_HEIGHT, bidEntries, buildPrizeTokensAppliedList, buildReceiptsDisplay, formatCurrency, formatValueByElementSettings, generateNewBidEntry, init, initBidsByAddress, numeral, reorderBidEntries, updateAdminPageVars, updateAuction, updateBidElement, updateBids, updatePageVars;
    bidEntries = {};
    BID_EL_HEIGHT = 66;
    numeral = window.numeral;
    AuctionSocket = window.AuctionSocket = {};
    AuctionSocket.connect = function(auctionSlug, isAdmin) {
      var socket;
      socket = window.io.connect();
      socket.on('status', function(data) {});
      socket.on('auction-update', function(data) {
        setTimeout(function() {
          return updateAuction(data, isAdmin);
        }, 1);
      });
      socket.on('disconnect', function() {});
      socket.on('connect', function() {
        socket.emit('listen', auctionSlug);
      });
      return socket.on('error', function(e) {
        return console.error("ERROR", e.stack);
      });
    };
    init = function() {
      return bidEntries = initBidsByAddress();
    };
    updateAuction = function(data, isAdmin) {
      updateBids(data.state.bids, data.state.accounts);
      updatePageVars(data.state, data.auction, data.meta);
      if (isAdmin) {
        return updateAdminPageVars(data.state, data.auction, data.meta);
      }
    };
    updateBids = function(bids, accounts) {
      var bid, bidEntry, _i, _len;
      for (_i = 0, _len = bids.length; _i < _len; _i++) {
        bid = bids[_i];
        bidEntry = bidEntries[bid.address];
        if (bidEntry == null) {
          bidEntry = generateNewBidEntry(bid);
        }
        updateBidElement(bidEntry, bid);
      }
      return reorderBidEntries();
    };
    updateBidElement = function(bidEntry, bid) {
      var amount, amountType, el, html, rankBadgeEl, rankIconEl, _i, _len, _ref;
      bidEntry.el.data('rank', bid.rank);
      if (bid.rank === 0) {
        bidEntry.el.addClass('winning');
      } else {
        bidEntry.el.removeClass('winning');
      }
      $('span[data-qty]', bidEntry.el).html(formatCurrency(bid.amount));
      _ref = ['prebid', 'late'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        amountType = _ref[_i];
        amount = bid.account[amountType];
        el = $("span[data-amount-" + amountType + "]", bidEntry.el);
        if (amount > 0) {
          el.html(formatCurrency(amount)).parent().show();
        } else {
          el.html('').parent().hide();
        }
      }
      rankBadgeEl = $('span[data-rank-badge]', bidEntry.el);
      html = bid.rank === 0 ? rankBadgeEl.data('leader-text') : "#" + (bid.rank + 1);
      rankBadgeEl.html(html);
      rankIconEl = $('*[data-rank-icon]', bidEntry.el);
      if (bid.rank === 0) {
        return rankIconEl.removeClass(rankIconEl.data('rank-icon-other')).addClass(rankIconEl.data('rank-icon-first'));
      } else {
        return rankIconEl.removeClass(rankIconEl.data('rank-icon-first')).addClass(rankIconEl.data('rank-icon-other'));
      }
    };
    updatePageVars = function(state, auction, meta) {
      var bounty, el, metaField, nextMinBid, nextPayment, phaseToShow, stateField, value, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
      bounty = state.bounty;
      nextMinBid = ((_ref = state.bids[0]) != null ? _ref.amount : void 0) + auction.minBidIncrement;
      nextPayment = nextMinBid + bounty;
      $('*[data-next-min-bid]').html(formatCurrency(nextMinBid));
      $('*[data-bounty]').html(formatCurrency(bounty));
      $('*[data-next-payment]').html(formatCurrency(nextPayment));
      _ref1 = ['blockId'];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        stateField = _ref1[_i];
        el = $("*[data-state-field=\"" + stateField + "\"]");
        if (!el.length) {
          continue;
        }
        value = formatValueByElementSettings(state[stateField], el);
        if (state.hasMempoolTransactions) {
          value = value + ' <span class="pending">pending</span>';
        }
        el.html(value);
      }
      _ref2 = ['lastBlockSeen'];
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        metaField = _ref2[_j];
        el = $("*[data-meta-field=\"" + metaField + "\"]");
        if (!el.length) {
          continue;
        }
        value = formatValueByElementSettings(meta[metaField], el);
        el.html(value);
      }
      buildReceiptsDisplay(auction.payoutReceipts);
      $('*[data-auction-status]').hide();
      phaseToShow = state.timePhase;
      if (state.timePhase === 'live' && !state.active) {
        phaseToShow = 'prebid';
      }
      $("*[data-auction-status=\"" + phaseToShow + "\"]").show();
      if ((_ref3 = state.bids) != null ? _ref3.length : void 0) {
        return $('*[data-no-bids]').hide();
      } else {
        return $('*[data-no-bids]').show();
      }
    };
    initBidsByAddress = function() {
      var counter, offset;
      bidEntries = {};
      counter = 0;
      offset = 0;
      $("li[data-bid-address]").each(function(index) {
        var el, yPos;
        el = $(this);
        bidEntries[el.data('bid-address')] = {
          el: el
        };
        yPos = index * BID_EL_HEIGHT + offset;
        el.data('yPos', yPos);
        el.css({
          position: 'absolute',
          top: yPos,
          width: el.outerWidth()
        });
        return ++counter;
      });
      $('ul.ordered-bids').height(counter * BID_EL_HEIGHT);
      return bidEntries;
    };
    reorderBidEntries = function() {
      var liEls;
      liEls = $('ul.ordered-bids > li');
      return liEls.tsort({
        data: 'rank',
        order: 'asc'
      }).each(function(i, el) {
        var $El, fromTop, toTop, width;
        $El = $(el);
        width = $El.outerWidth();
        fromTop = $.data(el, 'h');
        toTop = i * BID_EL_HEIGHT;
        return $El.css({
          position: 'absolute',
          top: fromTop,
          width: width
        }).animate({
          top: toTop
        }, 500);
      });
    };
    formatCurrency = function(amount) {
      if (amount == null) {
        return '';
      }
      if (isNaN(amount)) {
        return '';
      }
      return numeral(amount / 100000000).format('0,0.[00000000]');
    };
    generateNewBidEntry = function(bid) {
      var el, html, itemCount, newBidEntry, ul, yPos;
      html = "<li class=\"bid\" data-bid-address=\"" + bid.address + "\" data-rank=\"" + bid.rank + "\">\n    <span class=\"right badge\" data-rank-badge data-leader-text=\"Leader\">#" + (bid.rank + 1) + "</span>\n    <i data-rank-icon data-rank-icon-first=\"fa-rocket\" data-rank-icon-other=\"fa-user\" class=\"fa fa-user fa-2x left\"></i>\n    <div class=\"amount\">\n        <span data-qty>" + (formatCurrency(bid.amount)) + "</span> " + bid.token + "\n        <span class=\"prebid\" style=\"display: none;\">(<span data-amount-prebid>" + (formatCurrency(bid.account.prebid)) + "</span> pre-bid)</span>\n        <span class=\"late\" style=\"display: none;\">(<span data-amount-late>" + (formatCurrency(bid.account.late)) + "</span> late)</span>\n    </div>\n    <div class=\"address\">" + bid.address + "</div>\n</li>";
      ul = $('ul.ordered-bids');
      el = $(html).appendTo(ul);
      itemCount = $('li', ul).length;
      yPos = itemCount * BID_EL_HEIGHT;
      el.data('yPos', yPos);
      newBidEntry = {
        el: el
      };
      bidEntries[bid.address] = newBidEntry;
      ul.height(itemCount * BID_EL_HEIGHT);
      return newBidEntry;
    };
    buildReceiptsDisplay = function(receipts) {
      var list, receipt, src, _i, _len;
      list = $('.payout-transactions-list').empty();
      for (_i = 0, _len = receipts.length; _i < _len; _i++) {
        receipt = receipts[_i];
        src = "<div class=\"receipt\" data-receipt>\n    Sent\n    <span data-receipt-field=\"amountSent\" data-currency>" + (receipt.amountSent != null ? formatCurrency(receipt.amountSent) : formatCurrency(receipt.payout.amount)) + "</span>\n    <span <span data-payout-field=\"token\">" + receipt.payout.token + "</span>\n    to\n    <span class=\"address addressSmall\" data-payout-field=\"address\">" + receipt.payout.address + "</span>.\n    <span class=\"transaction-link right\"><a href=\"https://blockchain.info/tx/" + receipt.transactionId + "\" target=\"_blank\" data-receipt-field=\"transactionLink\">View Transaction <i class=\"fa fa-external-link\"></i></a></span>\n</div>";
        list.append($(src));
      }
      if (receipts.length) {
        $('#PayoutTransactions').show();
      } else {
        $('#PayoutTransactions').hide();
      }
    };
    formatValueByElementSettings = function(value, el) {
      if (!el.length) {
        return value;
      }
      if (el.is("[data-bool]")) {
        if (value) {
          value = "Yes";
          el.addClass('yes').removeClass('no');
        } else {
          value = "No";
          el.addClass('no').removeClass('yes');
        }
      }
      if (el.is("[data-currency]")) {
        value = formatCurrency(value);
      }
      if (el.is("[data-prize-token-list]")) {
        value = buildPrizeTokensAppliedList(value);
      }
      return value;
    };
    updateAdminPageVars = function(state, auction, meta) {
      var el, stateField, value, _i, _len, _ref, _results;
      _ref = ['btcFeeSatisfied', 'bidTokenFeeSatisfied', 'prizeTokensSatisfied', 'btcFeeApplied', 'bidTokenFeeApplied', 'active', 'prizeTokensApplied'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        stateField = _ref[_i];
        el = $("*[data-state-field=\"" + stateField + "\"]");
        if (!el.length) {
          continue;
        }
        value = formatValueByElementSettings(state[stateField], el);
        _results.push(el.html(value));
      }
      return _results;
    };
    buildPrizeTokensAppliedList = function(prizeTokensApplied) {
      var amount, list, token;
      if (!prizeTokensApplied) {
        return '';
      }
      list = (function() {
        var _results;
        _results = [];
        for (token in prizeTokensApplied) {
          amount = prizeTokensApplied[token];
          _results.push("" + (formatCurrency(amount)) + " " + token + " received");
        }
        return _results;
      })();
      if (list.length === 0) {
        return '';
      }
      return "(" + (list.join(', ')) + ")";
    };
    return init();
  })(jQuery);

}).call(this);
