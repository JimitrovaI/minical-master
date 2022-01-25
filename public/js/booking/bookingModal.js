/*  Plugin for Booking Modals
 *   It takes the element's id attr, and use it as bookingID
 */
var _createBookingLock = false;
var bookingDetails = [];

var bookingModalInvoker = function ($) {
    "use strict";

    var defaults = {};
    var defaultRoomCharge = {};

    // dynamically load required css
    var csses = [
        'css/bootstrap-colorselector.css',
        'css/bootstrap-tokenfield.min.css'
    ];

    csses.forEach(function (css) {
        if (document.createStyleSheet) {
            document.createStyleSheet(getBaseURL() + css);
        } else {
            $('<link rel="stylesheet" type="text/css" href="' + getBaseURL() + css + '" />').appendTo('head');
        }
    });

    // Ability for show decimal places
    var show_decimal = true;
    var add_remaining_daily_charges = true;
    var invoiceGroupId = '';
    //    var parent_rate_plan_id = false;

    var startTime = moment().startOf('day');
    var endTime = moment().endOf('day');

    var timeOptions = [];
    var time = startTime;

    while (time <= endTime) {
        timeOptions.push('<option value="' + time.format('hh:mm A') + '">' + time.format('hh:mm A') + '</option>');
        time = time.clone().add(30, 'm');
    }

    innGrid.ajaxCache = innGrid.ajaxCache || {};

    // dynamically load required js
    var scripts = [
        'js/booking/jquery.ui.autocomplete.scroll.min.js',
        'js/customer/customerModal.js',
        'js/bootstrap-tokenfield.js',
        'js/bootstrap-colorselector.js',
        'js/jquery.payment.js',
        'js/card_detail/cardModal.js'

    ];

    scripts.forEach(function (script) {
        $.getScript(getBaseURL() + script, function () {
        });

    });

    // initialize booking modal
    $("body").append(
        $("<div/>", {
            class: "modal fade",
            id: "booking-modal",
            "tabindex": "-1",
            "role": "dialog",
            "aria-hidden": true
        }).append(
            $("<div/>", {
                class: "alert-booking-created h1 text-center alert-success"
            }).hide()
        ).append(
            $("<div/>", {
                class: "modal-dialog modal-lg"
            }).append(
                $("<div/>", {
                    class: "modal-content"
                }).html("")
            )
        )
    ).append(
        $("<div/>", {
            class: "modal fade",
            id: "inner-modal",
            "tabindex": "-1",
            "role": "dialog",
            "aria-hidden": true
        }).append(
            $("<div/>", {
                class: "modal-dialog"
            }).append(
                $("<div/>", {
                    class: "modal-content"
                }).html("")
            )
        )
    )

    $("#inner-modal").modal({ show: false, backdrop: 'static', keyboard: false });
    $("#booking-modal").modal({ show: false, backdrop: 'static', keyboard: true });
    // $("#group-search-model").modal({ show: false, backdrop: 'static', keyboard: false });

    var BookingModal = function (options) {
        var that = this;

        this.deferredChargeWithDDL = $.Deferred();
        this.deferredRoomDDL = $.Deferred();
        this.deferredExistingCustomerConfirmation = $.Deferred();
        this.deferredBookingSource = $.Deferred();
        this.isCreatingCustomer = false;
        this.companyBookingSources = null;
        this.customBookingFields = null;
        this.deferredBookingFields = $.Deferred();
        this.options = $.extend({}, defaults, options);
        this._init();

        this.selectedGroupType = 'single';

        // new booking
        this.booking = {
            state: undefined,
            color: undefined,
            check_in_date: this.options.checkInDate,
            check_out_date: this.options.checkOutDate,
            current_room_id: this.options.roomID,
            current_room_type_id: this.options.roomTypeID,
            adult_count: 1,
            children_count: 0,
            balance: 0,
            pay_period: 0,
            //staying_customers: this.options.stayingCustomers,

        };
        this.groupInfo = null;
        this.saveAllGroupDate = null;

        this.disableRoomBlock = '';
        this.pointerNone = '';

        this.rateWithTax = null;
        this.rateInclusiveTax = null;

        this.ratePlanCache = {};
        this.roomTypesCache = {};
        this.roomsCache = {};

        if (this.options.isAddGroupBooking) {
            this.groupInfo = this.options.isAddGroupBooking;
        }


        if (!this.options.id) // new booking
        {
            this._populateNewBookingModal();
        } else //edit existing booking!
        {
            this._populateEditBookingModal();
        }


    };

    BookingModal.prototype = {
        _init: function () {

            var that = this;

            $('#booking-modal').modal('show');

            // remove reservation tooltip if still showing
            $('.tooltip-reservation').remove();

            this.closeModal = $.Deferred();
            $.when(this.closeModal.promise()).done(function (script) {
                $("#booking-modal").modal('hide');
            });

            this.sources = [];

            // array of different option buttons
            this.$allActions = {

                showHistory: $("<li/>").append(
                    $("<a/>", {
                        href: "#",
                        text: l("Show History")
                    }).on('click', function (e) {
                        e.preventDefault(); // prevent # scrolling to the top

                        that._initializeInnerModal();

                        $.ajax({
                            type: "POST",
                            url: getBaseURL() + "booking/get_history_AJAX",
                            data: {
                                booking_id: that.booking.booking_id
                            },
                            dataType: "json",
                            success: function (data) {
                                that._populateHistoryModal(data);
                            }
                        });
                    })
                ),

                addExtra: $("<li/>").append(
                    $("<a/>", {
                        href: "#",
                        text: l("Add Extra")
                    }).on('click', function (e) {
                        e.preventDefault(); // prevent # scrolling to the top

                        that._initializeInnerModal();

                        var extraData = {
                            extra_id: that.extras[0].extra_id,
                            extra_name: that.extras[0].extra_name,
                            start_date: that.booking.check_in_date,
                            end_date: that.booking.check_out_date,
                            quantity: 1,
                            rate: that.extras[0].rate
                        };

                        $.ajax({
                            type: "POST",
                            url: getBaseURL() + "extra/create_booking_extra_AJAX",
                            data: {
                                booking_id: that.booking.booking_id,
                                extra_data: extraData
                            },
                            dataType: "json",
                            success: function (response) {
                                that._editBookingExtra(response.booking_extra_id);

                                // update booking balance
                                if (response && $.isNumeric(response.balance)) {
                                    $('.booking_balance').html(number_format(response.balance, 2, ".", ""));
                                }

                                // if this is the first extra to this booking,
                                // create extra container (panel). otherwise, append extra to existing
                                extraData.booking_extra_id = response.booking_extra_id;
                                if ($("#extra-container").length) {
                                    extraData.charging_scheme = $("#inner-modal").find("[name='extra_id'] option:selected").attr('data-charging-scheme');
                                    $("#extra-container").append(that._getBookingExtraDiv(extraData));
                                } else {
                                    if (!that.booking.extras) {
                                        that.booking.extras = [];
                                    }
                                    that.booking.extras.push(extraData);
                                    var extraPanel = that._getExtraPanel();
                                    $("#booking-modal").find(".modal-body").append(extraPanel);
                                }
                            }
                        })
                    })
                ),

                deleteBooking: $("<button/>", {
                    type: "button",
                    class: "btn btn-light delete_booking m-2",
                    text: l('delete_booking')
                }),
                
                divider: $("<li/>", {
                    class: "divider"
                })

            };

            this._initializeBookingModal();


            $(document).off('click', '.delete_booking').on('click', '.delete_booking', function (e) {
                e.preventDefault();
                that._deleteBooking();
            })
        },

        _initializeBookingModal: function () {
            // re-initialize by deleting the existing modal

            this.$panel = $("<div/>", {
                //class: "box-body"
            }).append(
                $("<div/>", {
                    class: "panel-body",
                    style: 'padding:0px!important;'
                })
            );

            this.$rateInfo = $("<span/>", {
                class: 'rate-info',
                hidden: true
            })
                .append(
                    $("<span/>", {
                        class: 'charge-with-div form-group col-sm-6'
                    })
                        .append(
                            $('<label/>')
                                .append(
                                    $('<small/>', {
                                        text: l('charge_type')
                                    })
                                )
                        )
                )
                .append(
                    $("<div/>", {
                        class: ' col-sm-4 form-group rate-block',
                        style: 'padding-right: 0px;'
                    })
                        .append(
                            $('<label/>')
                                .append(
                                    $('<small/>', {
                                        text: l('rate')
                                    })
                                )
                        )
                        .append(
                            $('<div/>', {
                                class: 'input-group',
                                style: "padding: 1px"
                            })
                                .append(
                                    $("<span/>", {
                                        class: 'input-group-addon edit-rate-btn'
                                    })
                                        .append(
                                            $("<i/>", {
                                                class: 'fa fa-pencil-square-o',
                                                'aria-hidden': true
                                            })
                                        )
                                )
                                .append(
                                    $("<input/>", {
                                        name: 'rate',
                                        class: 'form-control',
                                        placeholder: "Rate",
                                        value: 0,
                                        type: 'number'
                                    })
                                )
                                .append(
                                    $('<span/>', {
                                        class: 'input-group-addon rate-including-tax hidden',
                                        style: 'padding: 2px;'
                                    })
                                )
                        )
                );

        },
        _initializeInnerModal: function () {
            // re-initialize by deleting the existing modal
            $("#inner-modal").modal('show');
            $("#inner-modal").find(".modal-content").html("");

            $("#inner-modal").on('hidden.bs.modal', function () {
                // hack to prevent closing inner-modal removing modal-open class in body.
                // when modal-open class is removed from body, scrolling the customer-modal scrolls
                // background, instead of scrolling the modal

                if (($("#booking-modal").data('bs.modal') || {}).isShown)
                    $("body").addClass("modal-open");
            })

        },

        _constructModalComponents: function () {
            var that = this;

            var modelBodyClass = '';
            var modalHeader = $("#booking-modal .modal-header");

            var state = this.booking.state;

            if (this.groupInfo != null) {
                modelBodyClass = (that.booking.booking_id) ? 'col-lg-7 booking-modal-body' : 'col-lg-9 booking-modal-body';
            } else {
                modelBodyClass = (that.booking.booking_id) ? 'col-lg-9 booking-modal-body' : 'col-lg-12 booking-modal-body';
            }

            this.$modalBody = $("<div/>", {
                class: "modal-body content " + modelBodyClass
            }).html(this._getBookingTypePanel());


            var roomTypeDIV = this.$modalBody.find('#booking_detail.room-type');
            roomTypeDIV.find("[name='check_in_date'], [name='check_out_date'], [name='number_of_days']")
                .on('change', function () {
                    that._updateRate(roomTypeDIV);
                });

            roomTypeDIV.find("[name='adult_count'], [name='children_count'], [name='rate']")
                .on('change', function () {
                    that.booking.state == 3 ? '' : that._validateCapacity();
                    that._updateRate(roomTypeDIV);
                });

            if (that.booking.source != 2 && that.booking.source != 3 && that.booking.source != 4 && that.booking.source != 8) {
                roomTypeDIV.find('.edit-rate-btn').on('click', function () {
                    that._initializeRateModal();
                });
            } else {
                roomTypeDIV.find('.edit-rate-btn').css('cursor', 'not-allowed');
            }

            // if walk-in, disable check-in date
            if ($("[name='state']").val() === '1' && that.booking.booking_id === undefined) {
                block.find("[name='check_in_date']").val(innGrid._getLocalFormattedDate($("#sellingDate").val()));
                block.find("[name='check_in_date']").prop("disabled", true);
            }

            $("#booking-modal").find(".modal-content")
                .append(
                    $("<div/>", {
                        class: "modal-header"
                    }
                    )
                )
                .append(this.$modalBody)
                .append(
                    $("<div/>", {
                        class: "modal-footer",
                        style: 'clear: both'
                    }
                    )
                );

            $('.modal-dialog.modal-lg').removeAttr('style');
            if (this.groupInfo != null) {
                $('.modal-dialog.modal-lg').css('width', '1110px');
                this.$modalBody.after(
                    $("<div/>", {
                        class: "col-lg-3",
                        //style: "padding: 0px 15px 0px 0px;"
                    }).append(
                        $("<div/>", {
                            class: "panel panel-default"
                        }).append(
                            $("<div/>", {
                                class: 'panel-heading '
                            }).append(
                                $("<h3/>", {
                                    text: l('Rooms'),
                                    class: "panel-title bold pull-left",
                                    style: "padding-top: 8px;"
                                })
                            )
                                .append(
                                    $("<div/>", {
                                        class: 'pull-right btn-group'
                                    }).append(
                                        $("<button/>", {
                                            html: l('Add a room'),
                                            class: 'btn btn-light btn-sm',
                                        })
                                            .prepend($('<i/>', { class: "fa fa plus" }))
                                            .on('click', function () {
                                                that.options.id = null;
                                                that.options.checkInDate = that.booking.check_in_date;
                                                that.options.checkOutDate = that.booking.check_out_date;
                                                that.options.isAddGroupBooking = that.groupInfo;
                                                // that.options.stayingCustomers = that.booking.staying_customers;
                                                $.fn.openBookingModal(that.options);

                                            })
                                    ).append(
                                        $("<button/>", {
                                            type: "button",
                                            class: "btn btn-light  btn-sm  dropdown-toggle",
                                            "data-toggle": "dropdown",
                                            "aria-expanded": false,
                                            text: l("Action") + " ",
                                        }).append(
                                            $("<span/>", {
                                                class: "caret"
                                            })
                                        )
                                    ).append(
                                        $("<ul/>", {
                                            class: "dropdown-menu other-actions",
                                            role: "menu",
                                            style: "min-width:200px"
                                        })
                                            .append(
                                                $("<li/>").append(
                                                    $("<a/>", {
                                                        href: "#",
                                                        //class: 'send_confirmation_email',
                                                        text: l('send_email_confirmation')
                                                    }).on("click", function (e) {
                                                        that._cancelDeleteGroupBookingRoom('Email');
                                                    })
                                                )
                                            )
                                            .append(
                                                $("<li/>", {}).append(
                                                    $("<a/>", {
                                                        href: '#',
                                                        text: l("Cancelled (Hide)")
                                                    }).on("click", function (e) {
                                                        e.preventDefault();
                                                        that._cancelDeleteGroupBookingRoom('Cancel');
                                                    })
                                                )
                                            )
                                            .append(
                                                $("<li/>", {}).append(
                                                    $("<a/>", {
                                                        href: '#',
                                                        text: l("Delete")
                                                    }).on("click", function (e) {
                                                        e.preventDefault();
                                                        that._cancelDeleteGroupBookingRoom('Delete');
                                                    })
                                                )
                                            )
                                    )
                                )
                                .append($('<div/>', { class: "clearfix" }))
                        )
                            .append(
                                $("<div/>", {
                                    class: "room-lists",
                                    style: 'clear: both;height: 477px;overflow: auto;'
                                })
                            )
                    )
                );

                this.$modalBody.before(
                    $("<div/>", {
                        class: "col-lg-2 sidebar-wrapper " + (that.booking.booking_id ? '' : 'hidden'),
                        style: "padding: 0px 15px 0px 0px;"
                    }).append(
                        $("<ul/>", {
                            class: "nav nav-tabs tabs-left left-sidebar",
                        }).append(
                            $("<li/>", {
                                class: 'active booking_detail'
                            }).append(
                                $("<a/>", {
                                    'href': '#booking_detail',
                                    'data-toggle': "tab",
                                    'text': l('booking_detail')
                                }).on('click', function (e) {
                                    that.$modalBody = $("<div/>", {
                                        class: "modal-body content " + modelBodyClass
                                    }).html(that._getBookingTypePanel());
                                    setTimeout(function () {
                                        that._setHeight('booking_detail');
                                    }, 1000);
                                })
                            )
                        ).append(
                            $("<li/>", {
                                // style: isTokenizationEnabled == 1 && innGrid.featureSettings.selectedPaymentGateway ? "" : "display: none;"
                            }).append(
                                $("<a/>", {
                                    'href': '#payment_details',
                                    'id': 'pay_details_tab',
                                    'data-toggle': "tab",
                                    'text': l('Payment Details')
                                }).on('click', function (e) {
                                    if (that.booking.state !== undefined) {
                                        if (that.booking.booking_customer_id) {
                                            var customer_array = new Array();
                                            $.ajax({
                                                type: "POST",
                                                url: getBaseURL() + "customer/get_customer_card_data",
                                                data: {
                                                    booking_id: that.booking.booking_id
                                                },
                                                dataType: "json",
                                                success: function (new_customer_data) {
                                                    if (new_customer_data != null) {
                                                        $(".is_primary_check").prop('disabled', false);
                                                        that._populatePaymentCard(new_customer_data, that.booking.booking_id);
                                                    }
                                                },
                                                error: function (e) {

                                                }
                                            });
                                        }
                                    }
                                    setTimeout(function () {
                                        that._setHeight('payment_details');
                                    }, 1000);
                                })
                            )
                        )
                            .append(
                                $("<li/>").append(
                                    $("<a/>", {
                                        'href': '#housekeeping',
                                        'data-toggle': "tab",
                                        'text': l('housekeeping')
                                    }).on('click', function (e) {
                                        if (that.booking.state !== undefined) {
                                            $.ajax({
                                                type: "POST",
                                                url: getBaseURL() + "booking/get_housekeeping_notes_AJAX",
                                                data: {
                                                    booking_id: that.booking.booking_id
                                                },
                                                dataType: "json",
                                                success: function (data) {
                                                    that._populateHousekeepingNotesModal(data);
                                                }
                                            })
                                        }
                                        setTimeout(function () {
                                            that._setHeight('housekeeping');
                                        }, 1000);
                                    })
                                )
                            )
                            .append(
                                $("<li/>", {
                                    class: "history_tab"
                                }).append(
                                    $("<a/>", {
                                        'href': '#history',
                                        'data-toggle': "tab",
                                        'text': l('history')
                                    }).on('click', function (e) {
                                        if (that.booking.state !== undefined) {
                                            $("#history").find(".content").html('');
                                            $.ajax({
                                                type: "POST",
                                                url: getBaseURL() + "booking/get_history_AJAX",
                                                data: {
                                                    booking_id: that.booking.booking_id
                                                },
                                                dataType: "json",
                                                success: function (data) {
                                                    that._populateHistoryModal(data);
                                                }
                                            });
                                        }
                                        setTimeout(function () {
                                            that._setHeight('history');
                                        }, 1000);
                                    })
                                )
                            )
                    )
                );

            } else {
                this.$modalBody.before(
                    $("<div/>", {
                        class: "col-lg-3 sidebar-wrapper " + (that.booking.booking_id ? '' : 'hidden'),
                        style: "padding: 0px 15px 0px 0px;"
                    }).append(
                        $("<ul/>", {
                            class: "nav nav-tabs tabs-left left-sidebar left-sidebar-fix-wep",
                        }).append(
                            $("<li/>", {
                                class: 'active'
                            }).append(
                                $("<a/>", {
                                    'href': '#booking_detail',
                                    'data-toggle': "tab",
                                    'text': l('booking_detail')
                                }).on('click', function (e) {
                                    that.$modalBody = $("<div/>", {
                                        class: "modal-body content " + modelBodyClass
                                    }).html(that._getBookingTypePanel());
                                    setTimeout(function () {
                                        that._setHeight('booking_detail');
                                    }, 1000);
                                })
                            )
                        )

                            .append(
                                $("<li/>", {
                                    // style: isTokenizationEnabled == 1 && innGrid.featureSettings.selectedPaymentGateway ? "" : "display: none;"
                                }).append(
                                    $("<a/>", {
                                        'href': '#payment_details',
                                        'id': 'pay_details_tab',
                                        'data-toggle': "tab",
                                        'text': l('Payment Details')
                                    }).on('click', function (e) {
                                        if (that.booking.state !== undefined) {
                                            var customer_array = new Array();
                                            if (that.booking.booking_id) {
                                                $.ajax({
                                                    type: "POST",
                                                    url: getBaseURL() + "customer/get_customer_card_data",
                                                    data: {
                                                        booking_id: that.booking.booking_id
                                                    },
                                                    dataType: "json",
                                                    success: function (new_customer_data) {
                                                        if (new_customer_data != null) {
                                                            // new_customer_data.push( {'booking_id': that.booking.booking_id} );
                                                            that._populatePaymentCard(new_customer_data, that.booking.booking_id);
                                                        }
                                                    },
                                                    error: function (e) {

                                                    }
                                                });
                                            }


                                        }
                                        setTimeout(function () {
                                            that._setHeight('payment_details');
                                        }, 1000);
                                    })
                                )
                            )
                            .append(
                                $("<li/>", {
                                    style: isTokenizationEnabled == 1 && innGrid.featureSettings.selectedPaymentGateway ? "" : "display: none;"
                                })
                            )
                            .append(
                                $("<li/>", {
                                    class: "history_tab"
                                }
                                ).append(
                                    $("<a/>", {
                                        'href': '#history',
                                        'data-toggle': "tab",
                                        'text': l('history')
                                    }).on('click', function (e) {
                                        if (that.booking.state !== undefined) {
                                            $("#history").find(".content").html('');
                                            $.ajax({
                                                type: "POST",
                                                url: getBaseURL() + "booking/get_history_AJAX",
                                                data: {
                                                    booking_id: that.booking.booking_id
                                                },
                                                dataType: "json",
                                                success: function (data) {
                                                    that._populateHistoryModal(data);
                                                }
                                            });
                                        }
                                        setTimeout(function () {
                                            that._setHeight('history');
                                        }, 1000);
                                    })
                                )
                            )
                            .append(

                                $("<li/>").append(
                                    $("<a/>", {
                                        'href': '#extras',
                                        'data-toggle': "tab",
                                        'text': l('extras')
                                    })
                                        .append(
                                            $("<span/>", {
                                                'class': 'extras_count',
                                                'text': " ( " + that.booking.extras_count + " )"
                                            })
                                        )
                                        .on('click', function (e) {
                                            setTimeout(function () {
                                                that._setHeight('extras');
                                            }, 1000);
                                        })
                                )
                            )
                    )
                );
            }

            if (that.booking.paying_customer) {
                $("[name='customer_name']").val(that.booking.paying_customer.customer_name);
                $("[name='customer_vehicle_number']").val(that.booking.paying_customer.vehicle_number);
            }

            $("[name='booking_notes']").val(that.booking.booking_notes);
            $("[name='adult_count']").val(that.booking.adult_count);
            $("[name='children_count']").val(that.booking.children_count);
            $("[name='pay_period']").val(that.booking.pay_period);
            $("[name='rate']").val(that.booking.rate);

            that._updateModalContent();
            this._updateRoomTypeDDL();
            this._bookingSource();
            this._bookingFields();
            this._showDecimal();
            this._dailyCharge();


            // disable checkin, checkout dates for ota bookings
            if (that.booking.source == 2 || that.booking.source == 3) {
                $('[name="check_in_date"]').parent()
                    .attr('data-toggle', "popover")
                    .popover({
                        content: l("Warning: You should not modify this value. Instead, the guest should change it through OTA (e.g. Booking.com)"),
                        placement: 'bottom',
                        trigger: "hover"
                    });
                $('[name="check_out_date"]').parent()
                    .attr('data-toggle', "popover")
                    .popover({
                        content: l("Warning: You should not modify this value. Instead, the guest should change it through OTA (e.g. Booking.com)"),
                        placement: 'bottom',
                        trigger: "hover"
                    });
            }


            $.when(this.deferredBookingSource).done(function () {
                if (that.companyBookingSources.length > 0) {
                    for (var key in that.companyBookingSources) {
                        var source = that.companyBookingSources[key];
                        // remove seasonal.io source
                        if (source['id'] == 15) {
                            if (that.booking.booking_id && that.booking.source == 15) {
                                $('select[name="source"]').append('<option value="' + source['id'] + '">' + l(source['name']) + '</option>');
                            }
                        } else {
                            $('select[name="source"]').append('<option value="' + source['id'] + '">' + l(source['name']) + '</option>');
                        }
                    }
                }
                if (that.booking.source) {
                    $('select[name="source"]').val(that.booking.source);
                }
                var height = $('.content').height() + 50;
                $('.left-sidebar').css('height', height);
            });

            $.when(this.deferredBookingFields).done(function () {
                if (that.customBookingFields) {
                    $.each(that.customBookingFields, function (key, value) {
                        var val = that.booking.custom_booking_fields && that.booking.custom_booking_fields[value.id] ? that.booking.custom_booking_fields[value.id] : "";
                        that._getCustomBookingFieldInput(value.name, "custom_booking_field[]", val, value.id, value.is_required).insertAfter('.booking_notes');
                    });
                }
            });

            var event = new CustomEvent('post.open_booking_modal', { "detail": { "reservation_id": that.booking.booking_id, "count": that.booking.extras_count } });
            // Dispatch/Trigger/Fire the event
            document.dispatchEvent(event);

        },
        _updateModalContent: function () {

            this._updateModalHeader();
            this._updateBookingType();
            this._updateModalFooter();

        },
        // _displayRateInfo: function (rateArray = null, taxArray = null, roomTypeDIV = null) {
        //     var that = this;
        //     var $parentEle = roomTypeDIV ? roomTypeDIV : this.$modalBody;
        //     var avgRate = 0;
        //     var rateCount = 0;
        //     var totalPreTaxRate = 0, totalInclusivePreTaxRate = 0;
        //     var totalRate = 0;
        //     var rateWithTax = 0;
        //     var numberOfDays = 0;
        //     var rateNoTax = 0, rateInclusiveTax = 0;
        //     var payPeriod = 0;

        //     if (rateArray && taxArray) {
        //         for (var key in rateArray) {
        //             var rate = parseFloat(rateArray[key]['rate']);
        //             var taxedRate = rate * (1 + parseFloat(taxArray.percentage)) + parseFloat(taxArray.flat_rate);
        //             var inclusiveTaxedRate = rate * (parseFloat(taxArray.inclusive_tax_percentage)) + parseFloat(taxArray.inclusive_tax_flat_rate);

        //             rateCount++;
        //             avgRate += rate;
        //             totalPreTaxRate += rate;
        //             totalRate += taxedRate;
        //             totalInclusivePreTaxRate += inclusiveTaxedRate;
        //         }
        //         avgRate = avgRate / rateCount;
        //     } else {
        //         rateWithTax = parseFloat(this.rateWithTax);

        //         numberOfDays = parseInt(this.$modalBody.find('input[name="number_of_days"]').val());
        //         rateNoTax = parseFloat($parentEle.find('input[name="rate"]').val());
        //         payPeriod = $parentEle.find('select[name="pay_period"]').val();
        //         avgRate = rateNoTax;
        //         totalPreTaxRate = numberOfDays * rateNoTax;
        //         totalRate = numberOfDays * rateWithTax;

        //         rateInclusiveTax = parseFloat(this.rateInclusiveTax);
        //         totalInclusivePreTaxRate = numberOfDays * rateInclusiveTax;

        //         if (payPeriod == 1) // weekly
        //         {
        //             avgRate = (rateNoTax / 7);
        //             totalPreTaxRate = (Math.floor(numberOfDays / 7) * rateNoTax) + (add_remaining_daily_charges ? ((rateNoTax / 7) * (numberOfDays % 7)) : 0);
        //             totalInclusivePreTaxRate = (Math.floor(numberOfDays / 7) * rateInclusiveTax) + (add_remaining_daily_charges ? ((rateInclusiveTax / 7) * (numberOfDays % 7)) : 0);
        //             totalRate = (Math.floor(numberOfDays / 7) * rateWithTax) + (add_remaining_daily_charges ? ((rateWithTax / 7) * (numberOfDays % 7)) : 0);
        //         } else if (payPeriod == 2) // monthly
        //         {
        //             var checkInDate = new Date(innGrid._getBaseFormattedDate($parentEle.find('input[name="check_in_date"]').val()));
        //             var checkOutDate = new Date(innGrid._getBaseFormattedDate($parentEle.find('input[name="check_out_date"]').val()));
        //             if (!checkInDate || !checkOutDate) {
        //                 return;
        //             }
        //             totalRate = totalPreTaxRate = totalInclusivePreTaxRate = 0;
        //             var lastPeriodDate = new Date(checkInDate.getTime());
        //             var date = new Date(checkInDate.getTime());

        //             date.setMonth(date.getMonth() + 1);
        //             for (date = date; date <= checkOutDate; date.setMonth(date.getMonth() + 1)) {
        //                 lastPeriodDate = new Date(date.getTime());
        //                 totalPreTaxRate += rateNoTax;
        //                 totalRate += rateWithTax;
        //                 totalInclusivePreTaxRate += rateInclusiveTax;
        //             }

        //             var dayDiff = parseInt((checkOutDate - lastPeriodDate) / (1000 * 60 * 60 * 24));
        //             if (dayDiff > 0 && add_remaining_daily_charges) {
        //                 totalPreTaxRate += ((rateNoTax / 30) * dayDiff);
        //                 totalRate += ((rateWithTax / 30) * dayDiff);
        //                 totalInclusivePreTaxRate += ((rateInclusiveTax / 30) * dayDiff);
        //             }
        //             avgRate = (totalPreTaxRate / numberOfDays);
        //         }
        //     }
        //     totalPreTaxRate -= totalInclusivePreTaxRate;


        //     if (avgRate >= 0) {
        //         if (payPeriod != 3) // one time charge
        //         {
        //             var avgGroupRateBlock = $("<div/>", {
        //                 class: "col-sm-12 form-group rate-extra-parent-div"
        //             }).append(
        //                 $("<div/>", {
        //                     class: "clearfix rate-extra-info-div",
        //                 })
        //                     .append(
        //                         $("<div/>", {
        //                             class: "col-sm-6 width-fix-wep",
        //                             //style: "padding-left: 0px;"
        //                         }).append(
        //                             $("<label/>", {
        //                                 class: "",
        //                             })
        //                                 .append(
        //                                     $("<small/>", {
        //                                         class: "",
        //                                         text: l('average_rate'),
        //                                         style: "text-align: right;"
        //                                     })
        //                                 )
        //                         ).append(
        //                             $("<span/>", {
        //                                 class: "input-group-addon",
        //                                 html: number_format(avgRate, 2, ".", ""),
        //                                 style: "line-height: 20px;border:  1px solid #ccc;border-radius: 4px;text-align: left;"
        //                             })
        //                         )
        //                     )
        //                     .append(
        //                         $("<div/>", {
        //                             class: "col-sm-6 per-txt-fix",
        //                             style: "padding: 0;"
        //                         }).append(
        //                             $("<label/>", {
        //                                 class: "",
        //                                 style: "padding-left: 15px;"
        //                             })
        //                                 .append(
        //                                     $("<small/>", {
        //                                         text: l('total_pre_tax')
        //                                     })
        //                                 )
        //                         )
        //                             .append(
        //                                 $("<span/>", {
        //                                     class: "col-sm-12",
        //                                     style: "padding-right: 0px;"
        //                                 })
        //                                     .append(
        //                                         $("<span/>", {
        //                                             class: "input-group-addon",
        //                                             text: number_format(totalPreTaxRate, 2, ".", ""),
        //                                             style: "line-height: 20px;border: 1px solid #ccc;"
        //                                         })
        //                                     ).append(
        //                                         $("<span/>", {
        //                                             class: "input-group-addon",
        //                                             html: "(" + l('with tax') + ": " + number_format(totalRate, 2, ".", "") + ")"
        //                                         })
        //                                     )
        //                             )
        //                     )
        //             );

        //             var avgSingleRateBlock = $("<div/>", {
        //                 class: "clearfix rate-extra-info-div",
        //                 style: "margin-bottom: 20px;"
        //             }).append(
        //                 $("<div/>", {
        //                     class: "col-sm-6",
        //                     style: "padding-left: 0px;"
        //                 }).append(
        //                     $("<label/>", {
        //                         class: "",
        //                     })
        //                         .append(
        //                             $("<small/>", {
        //                                 class: "",
        //                                 text: l('average_rate'),
        //                                 style: "text-align: right;"
        //                             })
        //                         )
        //                 ).append(
        //                     $("<span/>", {
        //                         class: "input-group-addon",
        //                         //html: number_format(avgRate, 2, ".", ""),
        //                         html: ((show_decimal) ? ((parseFloat(avgRate)).toLocaleString('en', {
        //                             style: 'decimal',
        //                             maximumFractionDigits: 2,
        //                             minimumFractionDigits: 2
        //                         })) : ((parseInt(avgRate)).toLocaleString())),
        //                         style: "line-height: 20px;border:  1px solid #ccc;border-radius: 4px;text-align: left;"
        //                     })
        //                 )
        //             ).append(
        //                 $("<div/>", {
        //                     class: "col-sm-6",
        //                     style: "padding: 0;"
        //                 }).append(
        //                     $("<label/>", {
        //                         class: "",
        //                         style: "padding-left: 15px;"
        //                     })
        //                         .append(
        //                             $("<small/>", {
        //                                 text: l('total_pre_tax')
        //                             })
        //                         )
        //                 )
        //                     .append(
        //                         $("<span/>", {
        //                             class: "col-sm-12",
        //                             style: "padding-right: 0px;"
        //                         })
        //                             .append(
        //                                 $("<span/>", {
        //                                     class: "input-group-addon",
        //                                     //text: number_format(totalPreTaxRate, 2, ".", ""),
        //                                     text: ((show_decimal) ? ((parseFloat(totalPreTaxRate)).toLocaleString('en', {
        //                                         style: 'decimal',
        //                                         maximumFractionDigits: 2,
        //                                         minimumFractionDigits: 2
        //                                     })) : ((parseInt(totalPreTaxRate)).toLocaleString())),
        //                                     style: "line-height: 20px;border: 1px solid #ccc;"
        //                                 })
        //                             ).append(
        //                                 $("<span/>", {
        //                                     class: "input-group-addon",
        //                                     //html: "(with tax: "+number_format(totalRate, 2, ".", "")+")"
        //                                     html: "(" + l('with tax') + ": " + ((show_decimal) ? ((parseFloat(totalRate)).toLocaleString('en', {
        //                                         style: 'decimal',
        //                                         maximumFractionDigits: 2,
        //                                         minimumFractionDigits: 2
        //                                     })) : ((parseInt(totalRate)).toLocaleString())) + ")"
        //                                 })
        //                             )
        //                     )
        //             );

        //             if ($('input[name=booking-type-radio]:checked').val() == 'group') {
        //                 $parentEle.find('.rate-extra-parent-div').html('').remove();
        //                 $parentEle.append(avgGroupRateBlock);
        //             } else {
        //                 $parentEle.find('.rate-extra-info-div').html('').remove();
        //                 this.$modalBody.find('.room-type').find('.booking_notes').prepend(avgSingleRateBlock);
        //             }
        //         } else {
        //             this.$modalBody.find('.rate-extra-info-div').remove();
        //         }
        //     }
        // },
        _populateNewBookingModal: function () {
            var that = this;
            $("#booking-modal").find(".modal-content").html("");

            // get extras for new booking
            if (!innGrid.ajaxCache.extras) {
                $.getJSON(getBaseURL() + 'extra/get_all_extras_JSON',
                    function (data) {
                        that.extras = data;
                        innGrid.ajaxCache.extras = data;
                    }
                );
            } else {
                that.extras = innGrid.ajaxCache.extras;
            }
            this._constructModalComponents();

        },
        _populateEditBookingModal: function () {

            var that = this;
            $("#booking-modal").find(".modal-content").html("");

            $.ajax({
                type: "POST",
                url: getBaseURL() + "booking/get_booking_AJAX",
                data: {
                    booking_id: this.options.id
                },
                dataType: "json",
                success: function (data) {

                    bookingDetails['booking'] = data.booking; // set globaly booking data
                    bookingDetails['extras'] = data.extras; // set globaly booking data
                    bookingDetails['group_info'] = data.group_info; // set globaly booking data

                    that.booking = data.booking;
                    that.extras = data.extras; // get all extras types that belong to company
                    that.groupInfo = data.group_info;

                    var ratePlanKey = that.booking.current_room_type_id + '-' + that.booking.rate_plan_id;
                    that.ratePlanCache[ratePlanKey] = data.rate_plan;

                    var roomTypeKey = innGrid._getBaseFormattedDate(that.booking.check_in_date) + '-' + innGrid._getBaseFormattedDate(that.booking.check_out_date);
                    that.roomTypesCache[roomTypeKey] = data.available_room_types;

                    var roomKey = that.booking.check_in_date + '-' + that.booking.check_out_date + '-' + that.booking.current_room_type_id + '-' + that.booking.booking_id + '-' + that.booking.current_room_id;
                    that.roomsCache[roomKey] = data.available_rooms;

                    that.booking.staying_customers.unshift(that.booking.paying_customer);
                    that._constructModalComponents();
                    $('#booking_detail').find('.token-input').css('width', '0px');
                    $('#booking_detail').find('.token-input').css('min-width', '0px');

                    if (data.booking.pay_period == 1 || data.booking.pay_period == 2) {
                        $('.add-daily-charges-div').show();
                        $('.add-daily-charges-div').parents('.pay-period-block').removeClass('col-sm-2').addClass('col-sm-3').prev().removeClass('col-sm-4').addClass('col-sm-3');
                        $('.add-daily-charges-div').parent('div').removeClass('form-group').addClass('input-group');
                    }

                    if (data.booking.state == 3) {
                        $('.guest_fields_row').addClass('hidden');
                    }
                },
                error: function () {
                    console.log("booking not accesible for this company/user");
                    //that._closeBookingModal();
                }

            }); // -- ajax call
        },
        _getBookingTypePanel: function () {
            var that = this;
            var state = this.booking.state;

            var check_in_date = that.booking.check_in_date ? that.booking.check_in_date : moment(new Date()).format("YYYY-MM-DD HH:mm:00");
            var check_out_date = that.booking.check_out_date ? that.booking.check_out_date : moment(new Date()).format("YYYY-MM-DD HH:mm:00");

            var panel = this.$panel.clone();


            var today = new Date();
            var year = today.getFullYear();
            var month = ("0" + (today.getMonth() + 1)).slice(-2);
            var day = ("0" + today.getDate()).slice(-2);
            today = year + '-' + month + '-' + day;


            if (that.groupInfo != null && that.booking.state == 4) {
                that.disableRoomBlock = 'cursor:not-allowed;background:#f2f2f2;pointer-events:none;';
            }

            panel.find(".panel-body")
                .append(
                    $("<div/>", {
                        class: "tab-content tab-gap-wep",
                        //style: "padding: 0px 15px 0px 0px;"
                    })
                        .append(
                            $("<div/>", {
                                'id': 'booking_detail',
                                'class': "tab-pane active room-type"
                            }).append(
                                $("<div/>", {
                                    class: "col-sm-12 booking-buttons"
                                })
                            )
                                .append(
                                    $("<div/>", {
                                        class: "guest_fields_row",
                                        style: "display: table;width: 100%;"
                                    })
                                        .append(
                                            $("<div/>", {
                                                class: "form-group col-sm-6 guest-block"
                                            })
                                                .append(
                                                    $("<label/>", {
                                                        for: "guests",
                                                    })
                                                        .append(
                                                            $("<small/>", {
                                                                text: l('guest')
                                                            })
                                                        )
                                                )
                                                .append(
                                                    $("<input/>", {
                                                        class: "form-control",
                                                        name: "customer_name",
                                                        placeholder: 'Guest Nickname',
                                                        rows: 1
                                                    })
                                                )
                                        )
                                        .append(
                                            $("<div/>", {
                                                class: "form-group col-sm-6 guest-block"
                                            })
                                                .append(
                                                    $("<label/>", {
                                                        for: "guests",
                                                    })
                                                        .append(
                                                            $("<small/>", {
                                                                text: l('Vehicle Number')
                                                            })
                                                        )
                                                )
                                                .append($('<span/>', { style: "color:red;", text: "*" }))
                                                .append(
                                                    $("<input/>", {
                                                        class: "form-control",
                                                        name: "customer_vehicle_number",
                                                        placeholder: 'Guest Car Number',
                                                        rows: 1
                                                    })
                                                )
                                        )

                                )
                                .append(
                                    $("<div/>", {
                                        class: "panel-booking clearfix",
                                        style: that.disableRoomBlock
                                    })
                                        //check -in start
                                        .append(
                                            $("<div/>", {
                                                class: "form-group col-sm-6"
                                            })
                                                .append(
                                                    $("<label/>", {
                                                        for: "checkin-date",
                                                    })
                                                        .append(
                                                            $("<small/>", {
                                                                text: l('check_in_date')
                                                            })
                                                        )
                                                )
                                                .append($('<span/>', { style: "color:red;", text: "*" }))
                                                .append(
                                                    $('<div/>', { class: innGrid.enableHourlyBooking ? 'hourly-booking-enabled' : '' })
                                                        .append(
                                                            $("<input/>", {
                                                                name: 'check_in_date',
                                                                class: 'form-control check-in-date-wrapper',
                                                                placeholder: "Check-in Date",
                                                                value: check_in_date,
                                                            })
                                                        )
                                                )
                                        ) //check -in end
                                        .append(
                                            $("<div/>", {
                                                class: "form-group col-sm-6"
                                            })
                                                .append(
                                                    $("<label/>")
                                                        .append(
                                                            $("<small/>", {
                                                                for: "state",
                                                                text: l('check_out_date')
                                                            })
                                                        )
                                                )
                                                .append($('<span/>', { style: "color:red;", text: "*" }))
                                                .append(
                                                    $("<input/>", {
                                                        type: 'hidden',
                                                        name: 'old_check_out_date',
                                                        id: 'old_check_out_date',
                                                        value: check_out_date
                                                    })
                                                )
                                                .append(
                                                    $("<input/>", {
                                                        type: 'hidden',
                                                        name: 'room_type_id',
                                                        value: that.booking.current_room_type_id
                                                    })
                                                )
                                                .append(
                                                    $("<input/>", {
                                                        type: 'hidden',
                                                        name: 'room_id',
                                                        value: that.booking.current_room_id
                                                    })
                                                )
                                                .append(
                                                    $('<div/>', { class: innGrid.enableHourlyBooking ? 'hourly-booking-enabled' : '' })
                                                        .append(
                                                            $("<input/>", {
                                                                name: 'check_out_date',
                                                                class: 'form-control check-out-date-wrapper',
                                                                placeholder: l("Check-out Date"),
                                                                value: check_out_date,
                                                            })
                                                        )
                                                )
                                        )//check -out end
                                        .append(
                                            $("<div/>", {
                                                class: "room-section " + (that.booking.booking_id ? '' : 'hidden')
                                            })

                                                .append(
                                                    $("<div/>", {
                                                        class: "form-group col-sm-6"
                                                    })
                                                        .append(
                                                            $("<label/>", {
                                                                for: "charge-type",
                                                            })
                                                                .append(
                                                                    $("<small/>", {
                                                                        text: l('charge_type')
                                                                    })
                                                                )
                                                        )
                                                        .append(
                                                            $("<span/>", {
                                                                class: 'charge-with-div'
                                                            })
                                                        )
                                                )// charge type end

                                                .append(
                                                    $("<div/>", {
                                                        class: "form-group col-sm-6 rate-block",
                                                        //style: "padding-right: 0px;"
                                                    })
                                                        .append(
                                                            $("<label/>", {
                                                                for: "rate",
                                                            })
                                                                .append(
                                                                    $("<small/>", {
                                                                        text: l('rate')
                                                                    })
                                                                )
                                                        )
                                                        .append(
                                                            $("<div/>", {
                                                                class: "input-group",
                                                                style: "padding: 1px"
                                                            })
                                                                .append(
                                                                    $("<span/>", {
                                                                        class: 'input-group-addon edit-rate-btn',
                                                                        //style: 'padding: 2px 15px;',
                                                                        //text: 'Edit'
                                                                    })
                                                                        .append(
                                                                            $("<i/>", {
                                                                                class: 'fa fa-usd',
                                                                                'aria-hidden': true
                                                                            })
                                                                        )
                                                                )
                                                                .append(
                                                                    $("<input/>", {
                                                                        name: 'taxed_rate',
                                                                        class: 'form-control',
                                                                        value: 0,
                                                                        type: 'hidden',
                                                                    })
                                                                )
                                                                .append(
                                                                    $("<input/>", {
                                                                        name: 'rate',
                                                                        class: 'form-control',
                                                                        placeholder: "Rate",
                                                                        value: 0,
                                                                        type: 'number',
                                                                    })
                                                                )
                                                                .append(
                                                                    $('<span/>', {
                                                                        class: 'input-group-addon rate-including-tax hidden',
                                                                        style: "padding: 2px;"
                                                                    })
                                                                )
                                                        )
                                                )// rate end


                                        )
                                )

                        )

                        .append(
                            $("<div/>", {
                                'id': 'payment_details',
                                'class': "tab-pane"
                            })

                                .append(
                                    $("<div/>", {
                                        class: "payment-modal modal-body"
                                    })
                                )
                                .append(
                                    $("<div/>", {
                                        class: "modal-inner-footer",
                                        id: "modal-inner-footer-new"
                                    })
                                )
                        )
                        .append(
                            $("<div/>", {
                                'id': 'history',
                                'class': "tab-pane tab-gap-wep"
                            }).append(
                                $("<div/>", {
                                    class: "content"
                                })
                            )
                        )
                        .append(
                            $("<div/>", {
                                'id': 'extras',
                                'class': "tab-pane"
                            })
                                .append(
                                    $("<div/>", {
                                        style: 'text-align:right;'
                                    })
                                        .append(
                                            $('<button/>', {
                                                class: 'btn btn-primary btn-sm',
                                                text: l('add_extra'),
                                                style: 'margin: 0px 0px 10px 0px;'
                                            }).on('click', function (e) {
                                                e.preventDefault(); // prevent # scrolling to the top

                                                if (!that.extras || !that.extras[0]) {
                                                    alert(l('Please add the extras first under Settings') + " > " + l('Rates') + " > " + l('Products'));
                                                    return;
                                                }

                                                that._initializeInnerModal();

                                                var extraData = {
                                                    extra_id: that.extras && that.extras[0] ? that.extras[0].extra_id : null,
                                                    extra_name: that.extras && that.extras[0] ? that.extras[0].extra_name : null,
                                                    start_date: that.booking.check_in_date,
                                                    end_date: that.booking.check_out_date,
                                                    quantity: 1,
                                                    rate: that.extras && that.extras[0] ? that.extras[0].rate : null
                                                };

                                                $.ajax({
                                                    type: "POST",
                                                    url: getBaseURL() + "extra/create_booking_extra_AJAX",
                                                    data: {
                                                        booking_id: that.booking.booking_id,
                                                        extra_data: extraData
                                                    },
                                                    dataType: "json",
                                                    success: function (response) {
                                                        that._editBookingExtra(response.booking_extra_id);

                                                        // update booking balance
                                                        if (response && $.isNumeric(response.balance)) {
                                                            $('.booking_balance').html(number_format(response.balance, 2, ".", ""));
                                                        }

                                                        var current_count = $('.left-sidebar').find('.extras_count').text().split(' ');
                                                        var new_count = (parseInt(current_count[2])) + 1;
                                                        $('.left-sidebar').find('.extras_count').html(" ( " + new_count + " )");
                                                        // if this is the first extra to this booking,
                                                        // create extra container (panel). otherwise, append extra to existing
                                                        extraData.booking_extra_id = response.booking_extra_id;
                                                        if ($("#extra-container").length) {
                                                            extraData.charging_scheme = $("#inner-modal").find("[name='extra_id'] option:selected").attr('data-charging-scheme');
                                                            $("#extra-container").append(that._getBookingExtraDiv(extraData));
                                                        } else {
                                                            if (!that.booking.extras) {
                                                                that.booking.extras = [];
                                                            }
                                                            that.booking.extras.push(extraData);
                                                            var extraPanel = that._getExtraPanel();
                                                            $("#booking-modal").find(".modal-body").find(".panel-body").find("#extras").append(extraPanel);
                                                        }
                                                    }
                                                })
                                            })
                                        )
                                )
                                .append(this._getExtraPanel())
                        )
                )


            panel.find('[name="check_in_date"]').attr('autocomplete', 'off');
            panel.find('[name="check_in_date"]').prop('disabled', true);
            panel.find('[name="check_out_date"]').attr('autocomplete', 'off');
            panel.find('[name="check_out_date"]').prop('disabled', true);

            return panel;
        },

        _dailyCharge: function () {
            var that = this;
            add_remaining_daily_charges = (that.booking.add_daily_charge == 0 ? false : true);
        },

        _showDailyChargeSetting: function () {
            var that = this;
            var pay_period = $('.pay_period').val();

            if (pay_period == 1 || pay_period == 2) {
                $('.add-daily-charges-div').show();
                $('.add-daily-charges-div').parents('.pay-period-block').removeClass('col-sm-2').addClass('col-sm-3').prev().removeClass('col-sm-4').addClass('col-sm-3');
                $('.add-daily-charges-div').parent('div').removeClass('form-group').addClass('input-group');
            } else {
                $('.add-daily-charges-div').hide();
                $('.add-daily-charges-div').parents('.pay-period-block').removeClass('col-sm-3').addClass('col-sm-2').prev().removeClass('col-sm-3').addClass('col-sm-4');
                $('.add-daily-charges-div').parent('div').removeClass('input-group').addClass('form-group');
            }
        },

        _bookingSource: function () {
            var that = this;
            if (!innGrid.ajaxCache.companyBookingSources) {
                $.post(getBaseURL() + "booking/get_booking_source_AJAX/",
                    function (data) {
                        if (data) {
                            that.companyBookingSources = jQuery.parseJSON(data);
                            innGrid.ajaxCache.companyBookingSources = that.companyBookingSources;
                            that.deferredBookingSource.resolve();
                        }
                    }
                );
            } else {
                that.companyBookingSources = innGrid.ajaxCache.companyBookingSources;
                that.deferredBookingSource.resolve();
            }
        },
        _bookingFields: function () {
            var that = this;
            if (!innGrid.ajaxCache.customBookingFields) {

                $.ajax({
                    type: "POST",
                    url: getBaseURL() + "booking/get_booking_fields",
                    dataType: "json",
                    success: function (data) {
                        that.customBookingFields = data;
                        innGrid.ajaxCache.customBookingFields = data;
                        that.deferredBookingFields.resolve();
                    }
                });
            } else {
                that.customBookingFields = innGrid.ajaxCache.customBookingFields;
                that.deferredBookingFields.resolve();
            }
        },
        _showDecimal: function () {
            if (innGrid.hideDecimalPlaces) {
                show_decimal = innGrid.hideDecimalPlaces != 0 ? false : true;
            }
            if (innGrid.makeGuestFieldMandatory && innGrid.makeGuestFieldMandatory == 1) {
                $('label[for="guests"]').append('<span class="guest_mandatory" style="color:red;">*</span>');
            }
        },
        _populateExtraModal: function (extra) {
            var that = this;

            // construct header
            $("#inner-modal").find(".modal-content")
                .append(
                    $("<div/>", {
                        class: "modal-header"
                    })
                        .append(l("Extra Information"))
                        .append(
                            $("<button/>", {
                                class: "close",
                                "data-dismiss": "modal",
                                "aria-label": "Close"
                            }).append(
                                $("<span/>", {
                                    "aria-hidden": "true",
                                    html: "&times;"
                                })
                            )
                        )
                )
                .append(
                    $("<div/>", {
                        class: "modal-body form-horizontal"
                    })
                        .append(this._getExtraSelect(l("Extra"), 'extra_id', that.extras, extra.extra_id))
                        .append(this._getHorizontalInput(l("Start Date"), 'start_date', extra.start_date))
                        .append(this._getHorizontalInput(l("End Date"), 'end_date', extra.end_date))
                        .append(this._getHorizontalInput(l("Quantity"), 'quantity', extra.quantity))
                        .append(this._getHorizontalInput(l("Rate"), 'rate', extra.rate))
                )
                .append(
                    $("<div/>", {
                        class: "modal-footer"
                    })
                        .append(
                            $("<button/>", {
                                type: "button",
                                class: "btn btn-success",
                                id: "button-update-extra",
                                text: l("Update")
                            }).on('click', function () {

                                var extraData = that._fetchExtraData();
                                $.ajax({
                                    type: "POST",
                                    url: getBaseURL() + "extra/update_booking_extra_AJAX",
                                    data: {
                                        booking_extra_id: extra.booking_extra_id,
                                        booking_extra_data: extraData,
                                        booking_id: that.booking.booking_id
                                    },
                                    dataType: "json",
                                    success: function (data) {
                                        // hack to properly generate extra div. it needs extra_name nad scheme
                                        extraData.extra_name = $("#inner-modal").find("[name='extra_id'] option:selected").text();
                                        extraData.booking_extra_id = extra.booking_extra_id;
                                        extraData.charging_scheme = $("#inner-modal").find("[name='extra_id'] option:selected").attr('data-charging-scheme');
                                        $(".extra#" + extra.booking_extra_id).replaceWith(that._getBookingExtraDiv(extraData));
                                        $("#inner-modal").modal('hide');

                                        // update booking balance
                                        if (data && $.isNumeric(data.balance)) {
                                            $('.booking_balance').html(number_format(data.balance, 2, ".", ""));
                                        }
                                    }
                                })
                            })
                        )
                        .append(
                            $("<button/>", {
                                type: "button",
                                class: "btn btn-light",
                                "data-dismiss": "modal",
                                text: l("Close")
                            })
                        )
                );

            var chargeScheme = $("#inner-modal [name='extra_id'] option:selected").attr('data-charging-scheme');
            if (chargeScheme == 'on_start_date') {
                $("#inner-modal").find('.block_end_date').remove();
                $("#inner-modal").find('.block_start_date').addClass('hidden');
            }

            $("#inner-modal").find("[name='start_date']").datepicker({
                dateFormat: ($('#companyDateFormat').val()).toLowerCase(),
                beforeShow: that._customRange
            });

            $("#inner-modal").find("[name='end_date']").datepicker({
                dateFormat: ($('#companyDateFormat').val()).toLowerCase(),
                beforeShow: that._customRange
            });

            $("#inner-modal").find("[name='extra_id']").on('change', function () {
                var extraVal = $(this).val();

                for (var key in that.extras) {
                    if (extraVal == that.extras[key].extra_id) {
                        $("#inner-modal").find('input[name="rate"]').val(that.extras[key].rate);
                    }
                }

                var chargeScheme = $(this).find('option[value="' + extraVal + '"]').attr('data-charging-scheme');
                if (chargeScheme == "on_start_date") {
                    $("#inner-modal").find('.block_end_date').remove();
                    $("#inner-modal").find('.block_start_date').addClass('hidden');
                } else {
                    $("#inner-modal").find('.modal-body').append(that._getHorizontalInput(l("End Date"), 'end_date', extra.end_date));
                    $("#inner-modal").find('.block_start_date').removeClass('hidden');
                }
            });

        },
        _populatePaymentCard: function (logs, booking_id) {
            var customer_array = new Array();
            for (var index = 0; index <= logs.length; index++) {

                if (Array.isArray(logs[index])) {
                    for (var index1 = 0; index1 <= logs[index].length; index1++) {
                        if (typeof (logs[index][index1]) == 'object') {
                            customer_array.push(logs[index][index1]);
                        }
                    }
                }
            }
            // console.log('customer_array', customer_array);
            var that = this;
            $("#payment_details").find(".payment-modal").html(
                $("<div/>", {
                    class: "row cardpanel"
                })
            )
            var count = 1;
            customer_array.forEach(function (log) {

                var cus_id = $('#hidden_customer_iden' + log.customer_id).val();
                var cus_name = "";
                var new_card_button = "";
                var card_details_part_one = "";
                var card_details_part_sec = "";
                var guest_name_heading = "";
                var is_primary_button = "";
                var error_part = "";

                if (cus_id != log.customer_id) {
                    cus_name = log.customer_name;
                    count = count + 1;
                    guest_name_heading = $("<div/>", {
                        class: "card_heading_div col-md-12",
                        id: "card_div_" + log.customer_id
                    }).append(
                        $("<span/>", {
                            class: "card_guest_span col-md-12",
                            id: "card_span_" + log.customer_id,
                            html: cus_name
                        })
                    ).append($("<input/>", {
                        type: "hidden",
                        id: "hidden_customer_iden" + log.customer_id,
                        value: log.customer_id
                    }))
                        .append(
                            $("<div/>", {
                                class: "add_card"
                            }).append(
                                $("<button/>", {
                                    type: "button",
                                    class: "btn add_card",
                                    id: "add_card",
                                    html: l("Add Card")
                                })
                            ).on("click", function (e) {
                                $(document).openCardModal({
                                    customer_id: log.customer_id,
                                    key_data: "new",
                                    booking_id: booking_id
                                });
                            })
                        )
                }
                if (cus_id != log.customer_id) {
                    error_part = $("<div/>", {
                        class: "error_div_" + log.customer_id
                    })
                }
                if (log.is_card_deleted == 0 && log.is_primary) {
                    if (log.is_primary == 1) {
                        var is_primary_button = $("<label/>", {
                            class: "switch"
                        }).append(
                            $("<input/>", {
                                type: "checkbox",
                                class: "is_primary_check",
                                "checked": "checked",
                                id: "is_primary" + log.id
                            })
                        ).append(
                            $("<span/>", {
                                class: "slider round"
                            }).append(
                                $("<span/>", {
                                    class: "p-label",
                                    html: l("Primary")
                                })
                            )
                        );
                    } else {
                        var is_primary_button = $("<label/>", {
                            class: "switch"
                        }).append(
                            $("<input/>", {
                                type: "checkbox",
                                class: "is_primary_check",
                                id: "is_primary" + log.id

                            })
                        ).append(
                            $("<span/>", {
                                class: "slider round"
                            }).append(
                                $("<span/>", {
                                    class: "p-label",
                                    html: l("Primary")
                                })
                            )
                        );
                    }
                }
                if (log.is_card_deleted == 0) {
                    card_details_part_one = $("<div/>", {
                        class: "card_div col-md-7 card_div_b_" + log.customer_id,
                        id: "card_div_b_" + log.id
                    }).append(
                        $("<input/>", {
                            type: "hidden",
                            id: "hidden_cus_id",
                            value: log.customer_id
                        })).append(
                            $("<table/>", {
                                class: "guest_card",
                            }).append(
                                $("<tr/>", {}).append(
                                    $("<td/>", {
                                        html: log.cc_number
                                    })
                                ).append(
                                    $("<td/>", {
                                        html: log.card_name
                                    })
                                )
                            ).append(
                                $("<tr/>", {}).append(
                                    $("<td/>", {
                                        html: log.cc_expiry_month + '/' + log.cc_expiry_year

                                    })
                                ).append(
                                    $("<td/>", {
                                        id: "table_td_" + log.id
                                    }).append(
                                        //on off
                                        is_primary_button
                                    )
                                )
                            )
                        )

                }
                if (log.is_card_deleted == 0) {
                    card_details_part_sec = $("<div/>", {
                        class: "remo_div col-md-5",
                        id: "card_div_sm_" + log.id
                    }).append(
                        $("<button/>", {
                            type: "button",
                            class: "close card-close fa fa-close",
                            id: "card_remove_" + log.cc_number

                        })
                    ).on("click", ".card-close", function () {
                        if (confirm("Are you sure to delete this card ?")) {
                            $(document).openCardModal({
                                customer_id: log.customer_id,
                                cus_card_id: log.id,
                                cus_card_token: log.cc_tokenex_token,
                                key_data: "delete",
                                booking_id: booking_id
                            });
                        }
                        return false;

                    })
                        .append(
                            $("<button/>", {
                                type: "button",
                                class: "close card-edit fa fa-edit",
                                id: "card_update"
                            })
                        ).on("click", ".card-edit", function () {

                            $(document).openCardModal({
                                customer_id: log.customer_id,
                                cus_card_id: log.id,
                                key_data: "update",
                                booking_id: booking_id
                            });
                        })
                }
                $(".payment-modal").find(".row").append(
                    guest_name_heading
                )
                if (log.cc_number) {
                    $(".payment-modal").find(".row").append(
                        guest_name_heading
                    ).append(
                        card_details_part_one
                    )
                        .append(
                            card_details_part_sec
                        )
                }
                $(".payment-modal").find(".row").append(
                    error_part
                )
                $("#remove_card").on("click", function () {
                    $(document).openCardModal({
                        customer_id: log.customer_id,
                        key_data: "delete",
                    });
                });


                $("#is_primary" + log.id).on("click", function () {
                    $(".is_primary_check").prop('disabled', true);
                    if ($("#is_primary" + log.id).prop('checked') == true) {
                        $.ajax({
                            type: "POST",
                            url: getBaseURL() + "customer/update_customer_card_is_primary",
                            data: {
                                customer_id: log.customer_id,
                                card_id: log.id,
                                active: "active"
                            },
                            dataType: "json",
                            success: function (is_primary_date) {
                                if (is_primary_date != null) {
                                    $('#pay_details_tab').click();
                                }
                            }
                        });
                    } else {
                        $.ajax({
                            type: "POST",
                            url: getBaseURL() + "customer/update_customer_card_is_primary",
                            data: {
                                customer_id: log.customer_id,
                                card_id: log.id,
                                active: "deactive"
                            },
                            dataType: "json",
                            success: function (is_primary_date) {
                                if (is_primary_date != null) {
                                    $('#pay_details_tab').click();
                                }
                            }
                        });
                    }
                });
            });
            customer_array.forEach(function (log) {
                if ($('.card_div_b_' + log.customer_id).length == 0) {
                    for (var i = 0; i <= count; i++) {
                        $(".payment-modal").find(".error_div_" + log.customer_id).html(
                            $("<span/>", {
                                class: "card_guest_span col-md-12",
                                id: "card_span_error",
                                html: l("No Card Activated Yet!")
                            })
                        )
                    }
                }
            });


        },
        _populateHousekeepingNotesModal: function (housekeeping_notes) {
            var that = this;

            $('#housekeeping').find(".notes").html(housekeeping_notes);

        },
        _populateHistoryModal: function (logs) {
            var that = this;

            // construct header
            //$("#inner-modal").find(".modal-content")


            logs.forEach(function (log) {

                $("#history").find(".content").append(
                    $("<div/>", {
                        class: "panel panel-default"
                    }).append(
                        $("<div/>", {
                            class: "panel-body",
                            html: log.date_time + " " + l('by') + " " + (log.user_id == '-1' ? l('Guest') : (log.first_name + " " + log.last_name)) + " - " + log.log
                        })
                    )
                )
            });

        },
        _populateExistingCustomerConfirmationModal: function (token, item) {
            var that = this;

            var existingCustomerDiv = $("<div/>", {
                text: "Did you mean: " + item.customer_name
            }).append(
                $("<div/>", {
                    class: "small",
                    text: ((item.email) ? item.email : '') + ((item.phone) ? " - " + item.phone : '') + ((item.city) ? " - " + item.city : '') + ((item.country) ? " - " + item.country : '')
                })
            );

            // construct header
            $("#inner-modal").find(".modal-content")
                .append(
                    $("<div/>", {
                        class: "modal-header"
                    })
                        .append("<b>\"" + item.customer_name + "\" " + l('already exists in the system') + "</b>")
                        .append(
                            $("<button/>", {
                                class: "close",
                                "data-dismiss": "modal",
                                "aria-label": "Close"
                            }).append(
                                $("<span/>", {
                                    "aria-hidden": "true",
                                    html: "&times;"
                                })
                            ).on("click", function () {
                                token.remove();
                            })
                        )
                )
                .append(
                    $("<div/>", {
                        class: "modal-body",
                        html: existingCustomerDiv
                    })
                )
                .append(
                    $("<div/>", {
                        class: "modal-footer"
                    })
                        .append(
                            $("<button/>", {
                                type: "button",
                                class: "btn btn-success",
                                text: l("Yes. It's a Returning Customer")
                            }).on("click", function () {
                                token.find(".token-label").text(item.customer_name); // to ensure capitalization is correctly reflected
                                token.attr("id", item.customer_id);
                                that.deferredExistingCustomerConfirmation.resolve();
                                $("#inner-modal").modal('hide');
                            })
                        )
                        .append(
                            $("<button/>", {
                                type: "button",
                                class: "btn btn-light",
                                text: l("No, It's a different customer with a same name")
                            }).on("click", function () {
                                that.deferredExistingCustomerConfirmation.resolve();
                                $("#inner-modal").modal('hide');
                            })
                        )
                );
        },
        _fetchExtraData: function () {
            var $inner_modal = $("#inner-modal");
            return {
                extra_id: $inner_modal.find("[name='extra_id']").val(),
                start_date: $inner_modal.find("[name='start_date']").val(),
                end_date: $inner_modal.find("[name='end_date']").val(),
                quantity: $inner_modal.find("[name='quantity']").val(),
                rate: parseFloat($inner_modal.find("[name='rate']").val()).toFixed(2),
            };
        },
        // Makes jquery datepicker to have limited range. (Greying out invalid selections)
        _customRange: function (input) {
            // disable the datepicker input field, so only calendar is allowed.
            //This also prevents keyboard pop up in ipad
            //$(this).attr("disabled", true);

            var dateMin = null;
            var dateMax = null;

            if (input.name == "check_in_date") {
                if ($("[name='check_out_date']").val() != '') {
                    dateMax = $("[name='check_out_date']").val();
                }
            } else if (input.name == "check_out_date") {
                if ($("[name='check_in_date']").val() != '') {
                    var dateMin = $("[name='check_in_date']").val();
                }
            }

            return {
                minDate: dateMin,
                maxDate: dateMax
            };

        },
        _getExtraPanel: function () {
            var that = this;

            var extras = this.booking.extras;

            if (extras === undefined)
                return '';

            if (extras.length === 0)
                return '';

            // prepare block template
            var block = $('<div/>', {
                class: 'panel panel-default extra-block'
            })
                .append(
                    $('<div/>', {
                        class: 'panel-body'
                    })
                );

            var extraContainer = $('<div/>', {
                class: 'col-sm-12',
                id: 'extra-container'
            });

            extras.forEach(function (bookingExtra) {
                extraContainer.append(that._getBookingExtraDiv(bookingExtra));
            });

            block.find(".panel-body").append(extraContainer);

            return block;
        },
        _getBookingExtraDiv: function (bookingExtra) {

            var that = this;

            var extraDiv = $("<div/>", {
                class: 'row extra',
                id: bookingExtra.booking_extra_id,
                style: "margin-bottom:10px;"
            })
            extraDiv.append(bookingExtra.quantity)
                .append(" " + bookingExtra.extra_name);

            if (bookingExtra.charging_scheme != 'on_start_date') {
                extraDiv.append(" " + l('between') + " ")
                    .append(bookingExtra.start_date)
                    .append(" " + l('and') + " ")
                    .append(bookingExtra.end_date);
            } else {
                extraDiv.append(' ' + l("on date") + ' ')
                    .append(bookingExtra.start_date);
            }
            extraDiv.append(l('at rate') + " : ")
                .append(bookingExtra.rate)
                .append(
                    $("<button/>", {
                        class: 'btn btn-light pull-right btn-xs',
                        type: 'button',
                        html: "<span class='glyphicon glyphicon-remove' aria-hidden='true'></span>",
                        style: "margin-left:10px;"
                    }).on('click', function () {

                        var extra = $(this).parent();
                        that._deleteExtra(extra.attr('id'));
                    })
                )
                .append(
                    $("<button/>", {
                        class: 'booking-extra btn btn-light pull-right btn-xs',
                        id: bookingExtra.booking_extra_id,
                        type: 'button',
                        html: "<span class='glyphicon glyphicon-pencil' aria-hidden='true'></span> " + l('Edit')
                    })
                        .on('click', function () {
                            that._editBookingExtra($(this).parent().attr("id"));

                        })
                )
            return extraDiv;
        },
        _editBookingExtra: function (bookingExtraID) {
            var that = this;

            that._initializeInnerModal();

            $.ajax({
                type: "POST",
                url: getBaseURL() + "extra/get_booking_extra_AJAX",
                data: {
                    booking_extra_id: bookingExtraID
                },
                dataType: "json",
                success: function (data) {
                    that._populateExtraModal(data);
                }
            });
        },
        _getBookingTypes: function (state) {

            var that = this;

            var select = $("<select/>", {
                class: 'form-control',
                name: 'state'
            })
            // new booking
            var options = [
                { value: 7, name: l('unconfirmed') + ' ' + l('reservation') },
                { value: 0, name: l('reservation') },
                { value: 1, name: l('checked_in') },
                { value: 2, name: l('checked_out') },
                { value: 4, name: l('cancelled') + ' (' + l('hide') + ')' },
                { value: 5, name: l('No-show') }
            ];

            if (state === undefined) {

                // if user is dragging mouse
                if (that.booking.check_in_date == $("#sellingDate").val() ||
                    that.booking.current_room_id === undefined) {
                    options[2].name = l('Walk-in');
                }

                options.push({ value: 3, name: l('Out of Order') });
                state = 0;
            } else if (state == '6') {
                // deleted
                var options = [
                    { value: 6, name: l('Deleted') }
                ];
            } else if (state == '3') {
                // out of order
                var options = [
                    { value: 3, name: l('Out of Order') }
                ];


            }

            options.forEach(function (data) {
                var option = $('<option/>', {
                    value: data.value,
                    text: data.name
                });

                if (data.value == state) {
                    option.prop('selected', true);
                }

                select.append(option);
            });

            return select.on('change', function () {

                var newState = $(this).val();
                var roomDiv = that.$modalBody.find("[name='room_id']");
                var roomCount = that.$modalBody.find("[name='room_count']");
                var rateInfo = that.$modalBody.find(".rate-info");
                var customerInfo = that.$modalBody.find(".customer-info");

                $('.guest_mandatory').show();
                $('.guest_fields_row').removeClass('hidden');

                that.booking.state = newState;

                switch (newState) {
                    case '0': // reservation
                        // make sure room information is already visible (this means check-in & check-out dates are selected)
                        if (roomDiv.is(":visible") || roomCount.is(":visible"))
                            rateInfo.fadeIn();
                        customerInfo.fadeIn();
                        break;
                    case '1': // walk-in
                        // make sure room information is already visible (this means check-in & check-out dates are selected)
                        if (roomDiv.is(":visible") || roomCount.is(":visible"))
                            rateInfo.fadeIn();
                        customerInfo.fadeIn();
                        break;
                    case '3': // out-of-order
                        rateInfo.fadeOut();
                        customerInfo.fadeOut();
                        $('.guest_mandatory').hide();
                        $('.guest_fields_row').addClass('hidden');
                        break;
                    case '4': // No Show
                        var balance = parseInt(that.booking.balance_without_forecast);
                        if (balance != '0' && !innGrid.featureSettings.bookingCancelledWithBalance) {
                            // balance is 0  when
                            //alert('You are unable to cancel a reservation with a balance on the invoice');
                            $('#reservation-message')
                                .modal('show')
                                .on('hidden.bs.modal', function () {
                                    if (($("#booking-modal").data('bs.modal') || {}).isShown)
                                        $("body").addClass("modal-open");
                                });
                            $('#reservation-message .message').html(l('You are unable to cancel a reservation with a balance on the invoice'));
                            $('.confirm-customer').on('click', function () {
                                $('#reservation-message').modal('hide');
                                return false;
                            });
                        }
                        break;
                }
            });
        },
        _updateModalHeader: function () {
            var that = this;

            var state = this.booking.state;

            var modalHeader = $("#booking-modal .modal-header");

            modalHeader.html(
                $("<button/>", {
                    class: "close",
                    "data-dismiss": "modal",
                    "aria-label": "Close"
                }).append(
                    $("<span/>", {
                        "aria-hidden": "true",
                        html: "&times;"
                    })
                ).css('margin-top', '-20px')
            );

            if (state !== undefined) {
                // If the booking is not out of order
                if (state !== '3') {
                    modalHeader.prepend(
                        $("<span/>", {
                            class: "h4",
                            html: l('edit_room') + " (" + l('id') + ": " + this.booking.booking_id + ") " + l('balance') + ": <a class='booking_balance' href='" + getBaseURL() + "invoice/show_invoice/" + this.booking.booking_id + "'>" + number_format(this.booking.balance, 2, ".", "") + "</a>  <br/>"
                        }).append(
                            $("<span/>", {
                                class: "h5 header_room_info",
                                html: " "
                            })
                        )
                    )
                } else {
                    modalHeader.prepend(
                        $("<span/>", {
                            class: "h4",
                            html: l("Edit Out-of-order")
                        })
                    )
                }
            } else {
                modalHeader.prepend(
                    $("<span/>", {
                        class: "h4 heading-fix-wep",
                        html: l("Create new Bill <br/>")
                    }).append(
                        $("<span/>", {
                            class: "h5 header_room_info",
                            html: " "
                        })
                    )
                );

                //$('.left-sidebar').find("li#registration_card").hide();
            }
            if (this.groupInfo != null) {
                modalHeader.append(
                    $("<span/>", {
                        class: "h4",
                        style: "padding-left: 20px",
                        html: l("Group") + " " + l("Id") + ": " + this.groupInfo.group_id
                    }).append(
                        $("<span/>", {
                            class: "h4",
                            style: "padding-left: 20px",
                            html: l("Group") + " " + l("Name") + ": " + this.groupInfo.group_name + " "
                        })
                    )
                );
                invoiceGroupId = this.groupInfo.group_id;
            } else {
                invoiceGroupId = '';
            }

            return modalHeader;
        },
        _updateModalFooter: function () {

            var that = this;
            var state = this.booking.state;
            var modalFooter = $("#booking-modal").find(".modal-footer").html("");
            var todays = ($("#sellingDate").val() + ' 00:00:00');
            var checkInDate = (this.booking.check_in_date);
            var checkOutDate = (this.booking.check_out_date);
            var disableClass = '';
            if (moment(checkInDate).format('YYYY-MM-DD') > moment(todays).format('YYYY-MM-DD')) {
                disableClass = 'disabled';
            }
            $('input[name=check_in_date], input[name=check_out_date]').prop('disabled', true);


            // checked-in
            if (state == 1) {
                modalFooter
                    .append(
                        $("<button/>", {
                            type: "button",
                            class: "btn btn-warning ",
                            id: "button-check-out",
                            text: l("Check out")
                        }).on('click', function () {

                            // Restrict check out if customer has a balance.
                            var bookingData = that._fetchBookingData();
                            var balance = parseInt(that.booking.balance);
                            if (balance != '0') {
                                //alert('This reservation cannot be checked out as the stay has not started yet');
                                $('#reservation-message')
                                    .modal('show')
                                    .on('hidden.bs.modal', function () {
                                        if (($("#booking-modal").data('bs.modal') || {}).isShown)
                                            $("body").addClass("modal-open");
                                    });
                                $('#reservation-message .message').html(l('You are unable to checkout with a balance on the invoice'));
                                $('.confirm-customer').on('click', function () {
                                    $('#reservation-message').modal('hide');
                                    return false;
                                });
                            } else {

                                that.button = $(this);
                                that.button.prop('disabled', true);

                                bookingData.booking.state = 2;
                                bookingData.rooms[0].check_out_date = moment(new Date()).format("YYYY-MM-DD HH:mm:00");
                                var action = 'early-check-out';
                                that._updateBooking(bookingData, l("Successfully checked-out"), action);

                            }
                        })
                    )
            }
            // Checked out
            if (state == 2) {
                // Restrict booking dates modification if customer has been checked out.
                if (that.booking.restrict_booking_dates_modification == 1) {
                    $('input[name=check_in_date], input[name=check_out_date]').prop('disabled', true);
                }
            }

            if (state === undefined) {
                modalFooter.append(
                    $("<button/>", {
                        type: "button",
                        class: "btn btn-success booking-create",
                        text: l("Create")
                    }).on('click', function () {
                        that.button = $(this);
                        that.button.prop('disabled', true);
                        var selling_date = moment($("#sellingDate").val() + ' 00:00:00').format('YYYY-MM-DD');
                        var checkInDate = moment(that.booking.check_in_date).format('YYYY-MM-DD');
                        if (checkInDate < selling_date) {
                            //alert('Charges will not be posted on a reservation created for a date in the past');
                            $('#reservation-message')
                                .modal('show')
                                .on('hidden.bs.modal', function () {
                                    if (($("#booking-modal").data('bs.modal') || {}).isShown)
                                        $("body").addClass("modal-open");
                                });
                            $('#reservation-message .modal-lg').removeClass('modal-lg').addClass('modal-sm');
                            $('#reservation-message .message-heading').text(l('Notice'));
                            $('#reservation-message .message').html(l('Charges will only be posted between current date and check-out date.'));
                            $('.confirm-customer').on('click', function () {
                                $('#reservation-message').modal('hide');
                                setTimeout(function () {
                                    $('#reservation-message .modal-sm').removeClass('modal-sm').addClass('modal-lg');
                                    $('#reservation-message .message-heading').text(l('Message'));
                                }, 1000);
                                return false;
                            });
                        }
                        if (that.isCreatingCustomer) {
                            that.deferredCreatingCustomer = $.Deferred();
                            $.when(that.deferredCreatingCustomer)
                                .done(function () {
                                    that._createBooking();
                                    that.button.prop('disabled', false);
                                    that.deferredCreatingCustomer = null;
                                    that.isCreatingCustomer = false;
                                })
                                .fail(function () {
                                    that.button.prop('disabled', false);
                                    that.deferredCreatingCustomer = null;
                                    that.isCreatingCustomer = false;
                                });
                        } else {
                            that._createBooking();
                            // that._makeRoomDirty(bookingData['rooms'][0]['room_id']);
                        }
                    })
                );
            } else {
                modalFooter.append(
                    $("<button/>", {
                        type: "button",
                        class: "btn btn-light booking-save-btn",
                        text: l("Save")
                    }).on('click', function () {
                        that.button = $(this);
                        //that.button.prop('disabled', true);
                        var todays = moment($("#sellingDate").val() + ' 00:00:00').format('YYYY-MM-DD');
                        var checkInDate = moment(that.booking.check_in_date).format('YYYY-MM-DD');
                        var balance = parseInt(that.booking.balance_without_forecast);
                        var reservationType = $('#booking_detail').find('select[name=state]').val();
                        var balance1 = parseInt(that.booking.balance);

                        if (checkInDate > todays && reservationType == '1') {
                            //alert('Guest cannot be checked in as the arrival is for a date in the future');
                            $('#reservation-message')
                                .modal('show')
                                .on('hidden.bs.modal', function () {
                                    if (($("#booking-modal").data('bs.modal') || {}).isShown)
                                        $("body").addClass("modal-open");
                                });
                            $('#reservation-message .message').html(l('Guest cannot be checked in as the arrival is for a date in the future'));
                            $('.confirm-customer').on('click', function () {
                                var flag = $(this).attr('flag');
                                if (flag == 'cancel') {
                                    $('#reservation-message').modal('hide');
                                    return false;
                                } else {
                                    $('#reservation-message').modal('hide');
                                    return false;
                                }
                            });
                        } else if (checkInDate > todays && reservationType == '2') {
                            //alert('This reservation cannot be checked out as the stay has not started yet');
                            $('#reservation-message')
                                .modal('show')
                                .on('hidden.bs.modal', function () {
                                    if (($("#booking-modal").data('bs.modal') || {}).isShown)
                                        $("body").addClass("modal-open");
                                });
                            $('#reservation-message .message').html(l('This reservation cannot be checked out as the stay has not started yet'));
                            $('.confirm-customer').on('click', function () {
                                var flag = $(this).attr('flag');
                                if (flag == 'cancel') {
                                    $('#reservation-message').modal('hide');
                                    return false;
                                } else {
                                    $('#reservation-message').modal('hide');
                                    return false;
                                }
                            });
                        } else if (reservationType == '4' && balance != 0 && !innGrid.featureSettings.bookingCancelledWithBalance) {
                            //alert('This reservation cannot be checked out as the stay has not started yet');
                            $('#reservation-message')
                                .modal('show')
                                .on('hidden.bs.modal', function () {
                                    if (($("#booking-modal").data('bs.modal') || {}).isShown)
                                        $("body").addClass("modal-open");
                                });
                            $('#reservation-message .message').html(l('You are unable to cancel a reservation with a balance on the invoice'));
                            $('.confirm-customer').on('click', function () {
                                $('#reservation-message').modal('hide');
                                return false;
                            });
                        } else if (reservationType == '4' && balance != 0 && innGrid.featureSettings.bookingCancelledWithBalance) {
                            $('#cancel-reservation')
                                .modal('show')
                                .on('hidden.bs.modal', function () {
                                    if (($("#booking-modal").data('bs.modal') || {}).isShown)
                                        $("body").addClass("modal-open");
                                });
                            $('#cancel-reservation .message').html(l('Are you sure you want to cancel a reservation with a balance on the invoice?'));
                            $('.confirm-customer').on('click', function () {
                                var flag = $(this).attr('flag');
                                if (flag == 'yes') {

                                    $('#cancel-reservation').modal('hide');

                                    var activeTab = $('.left-sidebar').find('li.active').find('a').html();
                                    if (activeTab == 'Housekeeping') {
                                        $.ajax({
                                            type: "POST",
                                            url: getBaseURL() + "booking/update_housekeeping_notes_AJAX",
                                            data: {
                                                booking_id: that.booking.booking_id,
                                                housekeeping_notes: $("#housekeeping").find("[name='housekeeping_notes']").val()
                                            },
                                            dataType: "json",
                                            success: function (data) {

                                            }
                                        })
                                    }
                                    if (that.saveAllGroupDate == true || that.saveAllGroupDate == false) {
                                        var bookingData = that._fetchBookingData();
                                        that._getAllGroupRoomBookingIds(bookingData);
                                    } else {
                                        var bookingData = that._fetchBookingData();
                                        that._updateBooking(bookingData);
                                    }
                                    that.saveAllGroupDate = null;
                                    that._showAlert(l("Saved"));
                                } else {
                                    $('#cancel-reservation').modal('hide');
                                    return false;
                                }
                            });
                        } else {

                            that._showAlert(l("Saved"));
                            var activeTab = $('.left-sidebar').find('li.active').find('a').html();
                            if (activeTab == 'Housekeeping') {
                                $.ajax({
                                    type: "POST",
                                    url: getBaseURL() + "booking/update_housekeeping_notes_AJAX",
                                    data: {
                                        booking_id: that.booking.booking_id,
                                        housekeeping_notes: $("#housekeeping").find("[name='housekeeping_notes']").val()
                                    },
                                    dataType: "json",
                                    success: function (data) {

                                    }
                                })
                            }
                            if (that.saveAllGroupDate == true || that.saveAllGroupDate == false) {
                                var bookingData = that._fetchBookingData();
                                that._getAllGroupRoomBookingIds(bookingData);
                            } else {
                                var bookingData = that._fetchBookingData();
                                that._updateBooking(bookingData);
                            }
                            that.saveAllGroupDate = null;
                        }
                    })
                );
            }

            return modalFooter.append(
                $("<button/>", {
                    type: "button",
                    class: "btn btn-light",
                    "data-dismiss": "modal",
                    text: l("Close")
                })
            );
        },
        _fetchBookingData: function () {
            var that = this;
            var payingCustomer = '';
            var stayingCustomers = [];
            var customerOrder = 0;
            var isGroupBooking = null;
            var groupName = '';
            var booked_by_id = '';

            if (that.selectedGroupType == 'linked_group') {
                isGroupBooking = true;
                groupName = this.$modalBody.find('input[name="group_name"]').val();
            }

            $("div.booked-by-block .tokenfield div.token").each(function () {
                booked_by_id = $(this).attr("id") ? $(this).attr("id") : null;
            });

            var rooms = [];
            if ($('input[name=booking-type-radio]:checked').val() == 'group') {
                var roomsBlock = $('#room-type-list').find('.room-type');
            } else {
                var roomsBlock = $('.room-type');
            }
            roomsBlock.each(function () {
                var useRatePlan = undefined;
                var ratePlanID = undefined;
                var chargeTypeID = undefined;

                if ($(this).find(".charge-with option:selected").hasClass('rate-plan') === true) {
                    // if user is using rate_plan, assign rate_plan_id
                    useRatePlan = 1;
                    ratePlanID = $(this).find(".charge-with").val();
                } else {
                    // if booking is not using rate plan, assign charge_type_id
                    useRatePlan = 0;
                    chargeTypeID = $(this).find(".charge-with").val();
                }

                rooms.push({
                    check_in_date: moment($("[name='check_in_date']").val(), "YYYY-MM-DD HH:mm").format("YYYY-MM-DD HH:mm:ss"),
                    check_out_date: moment($("[name='check_out_date']").val(), "YYYY-MM-DD HH:mm").format("YYYY-MM-DD HH:mm:ss"),
                    // for single booking
                    room_id: $(this).find("[name='room_id']").val(),
                    // for group booking
                    room_type_id: $(this).find("[name='room_type_id'] option:selected").val(),//$(this).find("[name='room_type_id']").val(),
                    room_count: $(this).find("[name='room_count']").val(),
                    rate: $(this).find("[name='rate']").val() ? $(this).find("[name='rate']").val() : 0,
                    taxed_rate: $(this).find("[name='taxed_rate']").val() ? $(this).find("[name='taxed_rate']").val() : 0,
                    use_rate_plan: useRatePlan,
                    rate_plan_id: ratePlanID,
                    charge_type_id: chargeTypeID,
                    pay_period: $(this).find("[name='pay_period']").val()
                });

            });

            var updateBookingData = {
                state: 1,
                rate: $("[name='rate']").val() ? $("[name='rate']").val() : 0,
                pay_period: $("[name='pay_period'] option:selected").val(),
                adult_count: $("[name='adult_count'] option:selected").val(),
                children_count: $("[name='children_count'] option:selected").val(),
                booking_notes: $("[name='booking_notes']").val(),
                source: $("[name='source'] option:selected").val(),
                booked_by: booked_by_id,
                add_daily_charge: (that.booking.add_daily_charge == 0 ? 0 : 1),
                taxed_rate: $("[name='taxed_rate']").val() ? $("[name='taxed_rate']").val() : 0,
                color: $("[name='color']").val()
            };

            var customer_name = $("[name='customer_name']").val();
            var customer_vehicle_number = $("[name='customer_vehicle_number']").val();

            var customerOptions = {
                customer_name: customer_name,
                vehicle_number: customer_vehicle_number,
            };

            payingCustomer = customerOptions


            var bookingData = {
                booking: updateBookingData,
                rooms: rooms,
                customers: {
                    paying_customer: payingCustomer,
                    staying_customers: stayingCustomers
                },
                isGroupBooking: isGroupBooking,
                groupName: groupName,
                guests: $('input[name=customers]').val() ? $('input[name=customers]').val() : ''
            };

            var booking_fields = [];

            $('input[name="custom_booking_field[]"]').each(function (i, v) {
                booking_fields.push({
                    id: $(this).attr('id'),
                    value: $(this).val()
                });
            });
            bookingData['custom_booking_fields'] = booking_fields;

            return bookingData;
        },
        convertTimeFormat(time) {
            time = time ? String(time) : "12:00 AM";
            var hours = Number(time.match(/^(\d+)/)[1]);
            var minutes = Number(time.match(/:(\d+)/)[1]);
            var AMPM = time.match(/\s(.*)$/)[1];
            if (AMPM == "PM" && hours < 12) hours = hours + 12;
            if (AMPM == "AM" && hours == 12) hours = hours - 12;
            var sHours = hours.toString();
            var sMinutes = minutes.toString();
            if (hours < 10) sHours = "0" + sHours;
            if (minutes < 10) sMinutes = "0" + sMinutes;
            return (sHours + ":" + sMinutes);
        },
        _showAlert: function (msg) {
            if (msg) {
                $(".alert-booking-created").text(msg).show(0, function () {
                    $(this).stop().fadeOut(3000);
                });
            }
        },
        _createBooking: function (text, is_duplicate = false, old_booking_id = null) {

            var that = this;
            var existGroupId = null;
            var data = this._fetchBookingData();
            var roomTypeAvailability = this.$modalBody.find('select[name="room_type_id"]').find('option:selected').data('room_type_availability');
            if ($('.btn-group input[name=booking-type-radio]:checked').val() == 'single' && (roomTypeAvailability == 0 || roomTypeAvailability == null)) {
                $('#reservation-message .message').html(l('There is no availability for the selected Room Type!'));
                $('#reservation-message').modal('show');
                $('.confirm-customer').on('click', function () {
                    $('#reservation-message').modal('hide');
                    return false;
                });
                that.button.prop('disabled', false);
                that.booking = {};
                return;
            }

            if (that.groupInfo != null)
                existGroupId = that.groupInfo.group_id

            if (typeof _createBookingLock !== "undefined" && _createBookingLock) {
                // booking creation already in progress
                return;
            }

            _createBookingLock = true;

            $.ajax({
                type: "POST",
                url: getBaseURL() + "booking/create_booking_AJAX",
                data: {
                    data: data,
                    existing_group_id: existGroupId,
                    is_duplicate: is_duplicate,
                    old_booking_id: old_booking_id
                },
                dataType: "json",
                success: function (response) {

                    // release the lock
                    _createBookingLock = false;

                    if (response.overbooking_status) {
                        $('#reservation-message .message').html(l("The selected room is no longer available. Please select a different room"));
                        $('#reservation-message')
                            .modal('show')
                            .on('hidden.bs.modal', function () {
                                if (($("#booking-modal").data('bs.modal') || {}).isShown)
                                    $("body").addClass("modal-open");
                            });
                        $('.confirm-customer').on('click', function () {
                            $('#reservation-message').modal('hide');
                            return false;
                        });
                        that.button.prop('disabled', false);
                        that.booking = {};
                        return;
                    }

                    // if booking(s) are walk-in's, make the rooms dirty
                    if (data.booking.state == 1) {
                        var rooms = data.rooms;

                        rooms.forEach(function (room) {
                            that._makeRoomDirty(room.room_id);
                        });

                    }
                    ;

                    // error handling happens here
                    if (response.errors !== undefined) {
                        var errorMsg = "";
                        response.errors.forEach(function (error) {
                            errorMsg += error + "<br/>";
                        });
                        $('#reservation-message .message').html(errorMsg);
                        $('#reservation-message')
                            .modal('show')
                            .on('hidden.bs.modal', function () {
                                if (($("#booking-modal").data('bs.modal') || {}).isShown)
                                    $("body").addClass("modal-open");
                            });
                        $('.confirm-customer').on('click', function () {
                            $('#reservation-message').modal('hide');
                            return false;
                        });
                        that.button.prop('disabled', false);
                        that.booking = {};
                        return;
                    } else {
                        //
                        // open "edit booking modal" if single booking is created
                        // if we just created multiple bookings, then don't open "edit booking modal"
                        if (response.length === 1) {
                            that.booking = data.booking;
                            that.booking.booking_id = response[0].booking_id;
                            that.booking.balance = response[0].balance;

                            //that._initializeBookingModal();

                            if (that.options.isAddGroupBooking != null) {
                                that.booking.check_in_date = that.options.checkInDate;
                                that.booking.check_out_date = that.options.checkOutDate;
                                that.booking.staying_customers = that.options.stayingCustomers;
                            } else {
                                that.booking.check_in_date = data.rooms[0].check_in_date;
                                that.booking.check_out_date = data.rooms[0].check_out_date;
                            }

                            that._showAlert(l("Successfully created"));

                            that._updateModalContent();

                            if (response[0] && response[0].rate_plan_id) {
                                var option = $("<option/>", {
                                    value: response[0].rate_plan_id,
                                    parent_rate_plan_id: data.rooms[0].rate_plan_id,
                                    text: response[0].rate_plan_name,
                                    class: 'rate-plan'
                                });

                                $('.charge-with optgroup:nth-child(2)').append(option);
                                option.prop("selected", true);
                            }


                            if (that.booking.pay_period == 1 || that.booking.pay_period == 2) {
                                $('.add-daily-charges-div').show();
                                $('.add-daily-charges-div').parents('.pay-period-block').removeClass('col-sm-2').addClass('col-sm-3').prev().removeClass('col-sm-4').addClass('col-sm-3');
                                $('.add-daily-charges-div').parent('div').removeClass('form-group').addClass('input-group');
                            } else {
                                $('.add-daily-charges-div').hide();
                                $('.add-daily-charges-div').parents('.pay-period-block').removeClass('col-sm-3').addClass('col-sm-2').prev().removeClass('col-sm-3').addClass('col-sm-4');
                                $('.add-daily-charges-div').parent('div').removeClass('input-group').addClass('form-group');
                            }

                            // Create the event
                            var event = new CustomEvent('post.open_booking_modal', { "detail": { "reservation_id": that.booking.booking_id, "booking_data": that.booking } });
                            var bookingCreatedEvent = new CustomEvent('booking_created', { "detail": { "reservation_id": that.booking.booking_id, "booking_data": that.booking, "booking_room_data": data.rooms[0] } });

                            // Dispatch/Trigger/Fire the event
                            document.dispatchEvent(event);
                            document.dispatchEvent(bookingCreatedEvent);

                            if ($("#current-page").val() === 'show_reservation_report_cm') {
                                setTimeout(function () {
                                    location.reload();
                                }, 500);
                            }
                        } else {

                            that.booking = data.booking;

                            // Create the event
                            var event = new CustomEvent('post.open_booking_modal', { "detail": { "reservation_id": that.booking.booking_id, "booking_data": that.booking } });
                            var bookingCreatedEvent = new CustomEvent('booking_created', { "detail": { "booking_data": that.booking, "booking_room_data": response } });

                            // Dispatch/Trigger/Fire the event
                            document.dispatchEvent(event);
                            document.dispatchEvent(bookingCreatedEvent);

                            that._closeBookingModal();
                        }

                    }

                    if (innGrid.reloadBookings) innGrid.reloadBookings();

                    // mixpanel tracking
                    mixpanel.track("Booking created");

                    // Intercom tracking
                    var metadata = {
                        booking_id: that.booking.booking_id ? that.booking.booking_id : null
                    };
                    // Intercom('trackEvent', 'booking-created', metadata);

                    $('.registration_card_tab').removeClass('hidden');
                    $('.sidebar-wrapper').removeClass('hidden');
                    $('.left-sidebar').find('.extras_count').html(" ( 0 )");
                    if (text != 'Create duplicate booking') {
                        if ($('.booking-modal-body').hasClass('col-lg-12')) {
                            $('.booking-modal-body').removeClass('col-lg-12').addClass('col-lg-9');
                            $('#booking_detail').find('.token-input').css('width', '0px');
                        } else if ($('.booking-modal-body').hasClass('col-lg-9')) {
                            $('.booking-modal-body').removeClass('col-lg-9').addClass('col-lg-7');
                            $('#booking_detail').find('.token-input').css('width', '0px');
                        }
                    }

                    setTimeout(function () {
                        location.reload();
                    }, 500);
                },
                error: function () {
                    // release the lock
                    _createBookingLock = false;
                }
            });
        },
        _closeBookingModal: function () {
            this.closeModal.resolve();
        },
        _makeRoomDirty: function (roomID) {
            var that = this;

            $.ajax({
                type: "POST",
                url: getBaseURL() + "room/update_room_status",
                data: {
                    room_id: roomID,
                    room_status: 'Dirty'
                },
                dataType: "json",
                success: function (data) {
                    if (!(innGrid.calendar && innGrid.calendar.destroy)) {
                        innGrid.reloadCalendar();
                    }
                }
            });
        },
        _updateBooking: function (data, msg, action = null) {

            var that = this;

            if (!data['booking']['color']) {
                var selectedColor = $('[name=color]').data('selected-color');
                var selectedState = $('[name=color]').data('selected-state');
                if (selectedColor && selectedState == data['booking']['state']) {
                    data['booking']['color'] = selectedColor;
                }
            }

            // merge in the changes to booking
            $.each(data.booking, function (key, value) {
                that.booking[key] = data.booking[key];
            });

            // update availabilities of the dates prior to update
            // why do we need it?

            $.ajax({
                type: "POST",
                url: getBaseURL() + "booking/update_booking_AJAX",
                data: {
                    booking_id: this.booking.booking_id,
                    data: data
                },
                dataType: "json",
                success: function (response) {
                    if (response.response == 'failure') {
                        $('#reservation-message').modal('show');
                        $('#reservation-message .message').html(response.message);
                        $('.confirm-customer').on('click', function () {
                            $('#reservation-message').modal('hide');
                            $('#reservation-message').on('hidden.bs.modal', function () {
                                $('body').addClass('modal-open');
                            });
                            return false;
                        });
                    }
                    if (response.errors !== undefined) {
                        var errorMsg = "";
                        response.errors.forEach(function (error) {
                            errorMsg += error + "\n";
                        });
                        $('#reservation-message .message').html(errorMsg);
                        $('#reservation-message').modal('show');
                        $('.confirm-customer').on('click', function () {
                            $('#reservation-message').modal('hide');
                            return false;
                        });
                        that.button.prop('disabled', false);
                    } else {

                        that._showAlert(msg);
                        that._updateModalContent();

                        // update booking balance
                        if (response && $.isNumeric(response.balance)) {
                            $('.booking_balance').html(number_format(response.balance, 2, ".", ""));
                        }

                        // update availabilities of the dates after the update

                        var bookingUpdatedEvent = new CustomEvent('booking_updated', { "detail": { "reservation_id": that.booking.booking_id, "booking_data": data } });
                        document.dispatchEvent(bookingUpdatedEvent);

                        if (action === "early-check-out") {
                            // update checkout date in modal in case of early checkout
                            $('[name="check_out_date"]').val(innGrid._getLocalFormattedDate(data.rooms[0].check_out_date));
                        }
                        if (data.booking.state != 4 && that.groupInfo != null) {
                            that.disableRoomBlock = '';
                            that.pointerNone = '';
                            that.$modalBody.find('.panel-booking').attr('style', that.disableRoomBlock);
                            that.$modalBody.find('.panel-booking .form-inline').attr('style', that.pointerNone);

                        }
                        // if ($("#current-page").val() === 'show_reservation_report_cm') {
                        setTimeout(function () {
                            location.reload();
                        }, 500);
                        // }
                    }

                    if (innGrid.reloadBookings) innGrid.reloadBookings();
                }
            });
        },

        _deleteBooking: function (isGroupBookingDel, groupBookingId, key = 0) {
            var that = this;
            var answer = key === 0 ? confirm(l("Are you sure you want to delete this booking?")) : true;
            if (groupBookingId != null) {
                var bookingId = groupBookingId;
            } else {
                var bookingId = that.booking.booking_id;
            }

            if (answer == true) {
                this.button = $(this);
                this.button.prop('disabled', true);

                $.ajax({
                    type: "POST",
                    url: getBaseURL() + "booking/delete_booking_AJAX",
                    dataType: "json",
                    data: {
                        booking_id: bookingId
                    },
                    success: function (data) {
                        // data = (data == "") ? data : JSON.parse(data);
                        if (data.response == "success") // if successful, delete_booking_AJAX returns empty page
                        {
                            var bookingDeletedEvent = new CustomEvent('booking_deleted', { "detail": { "reservation_id": that.booking.booking_id, "booking_data": that.booking } });
                            document.dispatchEvent(bookingDeletedEvent);

                            if (isGroupBookingDel == true) {
                            } else {
                                that._closeBookingModal();
                            }
                        } else if (data.response == 'failure') {
                            $('#reservation-message').modal('show');
                            $('#reservation-message .message').html(data.message);
                            $('.confirm-customer').on('click', function () {
                                $('#reservation-message').modal('hide');
                                $('#reservation-message').on('hidden.bs.modal', function () {
                                    $('body').addClass('modal-open');
                                });
                                return false;
                            });
                        } else {
                            alert(l("You do not have permission to delete booking"));
                        }

                        if (innGrid.reloadBookings) innGrid.reloadBookings();
                    }
                });

            }
            return answer;
        },
        _deleteExtra: function (bookingExtraID) {
            var that = this;
            var answer = confirm(l("Are you sure you want to delete this extra?"));
            if (answer == true) {

                $.ajax({
                    type: "POST",
                    url: getBaseURL() + "booking/delete_booking_extra_AJAX",
                    data: {
                        booking_extra_id: bookingExtraID
                    },
                    dataType: "json",
                    success: function (data) {
                        $(".extra#" + bookingExtraID).remove();

                        var current_count = $('.left-sidebar').find('.extras_count').text().split(' ');
                        var new_count = (parseInt(current_count[2])) - 1;
                        $('.left-sidebar').find('.extras_count').html(" ( " + new_count + " )");

                        $.each(that.booking.extras, function (i, value) { // unset booking extra id that is deleted
                            if (value.booking_extra_id == bookingExtraID) {
                                that.booking.extras.splice(i, 1);
                            }
                        });

                        // update booking balance
                        if (data && $.isNumeric(data.balance)) {
                            $('.booking_balance').html(number_format(data.balance, 2, ".", ""));
                        }

                        // delete panel if there's no extra
                        if ($(".extra").length === 0) {
                            $(".extra-block").remove();
                        }

                    }
                });
            }
        },
        _convertToCurrency: function (num) {
            num = (isNaN(num) || num === '' || num === null) ? 0.00 : num;
            return parseFloat(num).toFixed(2);
        },

        _updateBookingType: function () {
            var that = this;

            var state = this.booking.state;

            if (state === undefined) {
                $("[name='state']").val(0); // assume new booking is reservation
                return;
            } else {
                $("[name='state']").val(state); // set booking type drop down
            }

            var $actions = {};

            switch (parseInt(state)) {
                case 0: // reservation
                case 1: // inhouse
                case 2: // check-out
                case 7: // unconfirmed reservation
                    $actions = [
                        this.$allActions.showInvoice,
                    ];
                    $actions.push(this.$allActions.divider);
                    $actions.push(this.$allActions.deleteBooking);


                    break;
                case 3: // out of order
                case 4: // cancelled
                    $actions = [
                        this.$allActions.showInvoice,
                        this.$allActions.divider,
                        this.$allActions.deleteBooking
                    ];
                    break;
                case 5: // no show
                    $actions = [
                        this.$allActions.showHistory,
                        this.$allActions.divider,
                        this.$allActions.deleteBooking
                    ];

                    break;
                case 6: // deleted
                    $actions = [
                        this.$allActions.showHistory
                    ];
                    break;

            }

            var actionsUL = $("<ul/>", {
                class: "dropdown-menu pull-right other-actions",
                role: "menu",
                style: "min-width:230px"
            });

            $.each($actions, function (name, action) {
                actionsUL.append(action);
            });

            var modalHeader = $("#booking-modal .modal-header");

            modalHeader.append(
                $("<div/>", {
                    class: "btn-group pull-right",
                    role: "group"

                })
                    .append(
                        $("<a/>", {
                            class: "btn btn-light m-2",
                            href: getBaseURL() + "invoice/show_invoice/" + that.booking.booking_id,
                            text: l('open_invoice')
                        })
                    )
                    .append(this.$allActions.deleteBooking)
            );
        },

        //Populate room drop down list based on checkin, checkout, and roomtype
        _updateRoomTypeDDL: function (roomTypeDIV) {
            var that = this;

            if (this.booking.current_room_type_id == null) {
                this.booking.current_room_type_id = this.$modalBody.find("[name='room_type_id']").val();
            }

            if (roomTypeDIV == undefined) {
                var roomTypeDIV = this.$modalBody.find(".room-type");
                //roomTypeDIV.attr("id", this.booking.current_room_type_id);
            }

            if (
                that.$modalBody.find("[name='check_in_date']").val() === '' ||
                that.$modalBody.find("[name='check_out_date']").val() === ''
            ) {
                return;
            }

            var checkInDate = moment(innGrid._getBaseFormattedDate(that.$modalBody.find("input[name='check_in_date']").val()) + ' ' + that.convertTimeFormat(that.$modalBody.find("[name='check_in_time']").val())).format('YYYY-MM-DD HH:mm:ss');
            var checkOutDate = moment(innGrid._getBaseFormattedDate(that.$modalBody.find("input[name='check_out_date']").val()) + ' ' + that.convertTimeFormat(that.$modalBody.find("[name='check_out_time']").val())).format('YYYY-MM-DD HH:mm:ss');

            var get_available_room_types_callback = function (data) {

                if (data !== '' && data !== null && data.length > 0) {
                    for (var i in data) {
                        if (that.booking.current_room_type_id == data[i].id) {
                            $('.header_room_info').html(data[i].name)
                        }
                    }
                }
                that._updateRoomDDL(roomTypeDIV);
                that._updateChargeWithDDL(roomTypeDIV);
            };

            var roomTypeKey = checkInDate + '-' + checkOutDate;
            if (typeof that.roomTypesCache[roomTypeKey] !== "undefined" && that.roomTypesCache[roomTypeKey]) {

                get_available_room_types_callback(that.roomTypesCache[roomTypeKey]);

            } else {

                $.post(getBaseURL() + 'booking/get_available_room_types_in_JSON', {
                    check_in_date: encodeURIComponent(checkInDate),
                    check_out_date: encodeURIComponent(checkOutDate),
                    isAJAX: true
                }, get_available_room_types_callback, 'json');

            }


            $('.room-section').removeClass('hidden');
        },

        _updateRoomDDL: function (roomTypeDIV) {

            var that = this;
            var curr_room_id = that.booking && that.booking.current_room_id ? that.booking.current_room_id : null;

            var checkInDate = moment(innGrid._getBaseFormattedDate(this.$modalBody.find("input[name='check_in_date']").val()) + ' ' + that.convertTimeFormat(this.$modalBody.find("[name='check_in_time']").val())).format('YYYY-MM-DD HH:mm:ss');
            var checkOutDate = moment(innGrid._getBaseFormattedDate(this.$modalBody.find("input[name='check_out_date']").val()) + ' ' + that.convertTimeFormat(this.$modalBody.find("[name='check_out_time']").val())).format('YYYY-MM-DD HH:mm:ss');

            var roomTypeID = that.booking.current_room_type_id;

            var get_available_rooms_callback = function (data) {

                if (data !== '' && data !== null && data.length > 0) {
                    for (var i in data) {

                        //Keep the same room selected if it is still on the list
                        if (that.booking.current_room_id == data[i].room_id) {
                            $('.header_room_info').append(": " + data[i].room_name)
                            if (!$("[name='customer_name']").val()) {
                                $("[name='customer_name']").val(data[i].room_name + '-guests')
                            }
                        }
                    }
                }
            };

            var roomKey = checkInDate + '-' + checkOutDate + '-' + roomTypeID + '-' + that.booking.booking_id + '-' + curr_room_id;
            if (typeof that.roomsCache[roomKey] !== "undefined" && that.roomsCache[roomKey]) {
                get_available_rooms_callback(that.roomsCache[roomKey]);
            } else {
                $.ajax({
                    type: "POST",
                    url: getBaseURL() + 'booking/get_available_rooms_in_AJAX/',
                    data: {
                        check_in_date: checkInDate,
                        check_out_date: checkOutDate,
                        room_type_id: roomTypeID,
                        room_id: curr_room_id,
                        booking_id: that.booking.booking_id
                    },
                    dataType: "json",
                    success: get_available_rooms_callback
                });
            }

        },

        _setHeight: function (tab) {
            var height = $('#' + tab).height() + 100;
            if ($('#' + tab).height() < 320) {
                $('.left-sidebar').css('height', '350');
            } else {
                $('.left-sidebar').css('height', height);
            }
        },
        _validateCapacity: function () {
            var adult_count = this.$modalBody.find('[name="adult_count"] option:selected').val();
            var children_count = this.$modalBody.find('[name="children_count"] option:selected').val();
            var $selected_room_type = this.$modalBody.find("[name='room_type_id'] option:selected");
            var max_adults = $selected_room_type.data('max_adults');
            var max_children = $selected_room_type.data('max_children');
            var max_occupancy = $selected_room_type.data('max_occupancy');
            var total = parseInt(adult_count) + parseInt(children_count);
            var min_occupancy = $selected_room_type.data('min_occupancy');
            var that = this;
            if (adult_count > max_adults || children_count > max_children) {
                $('#reservation-message').modal('show');
                $('#reservation-message .message').html(l('Maximum occupancy required for this room type is') + " \n " + l('Maximun adults') + " " + max_adults + " \n" + l('Maximun children') + " " + max_children);
                $('.confirm-customer').on('click', function () {
                    $('#reservation-message').modal('hide');
                    $('#reservation-message').on('hidden.bs.modal', function () {
                        $('body').addClass('modal-open');
                    });
                    return false;
                });
                if (adult_count > max_adults)
                    this.$modalBody.find('[name="adult_count"]').val(max_adults);
                if (children_count > max_children)
                    this.$modalBody.find('[name="children_count"]').val(max_children);
            } else if (max_occupancy && total > max_occupancy) {
                $('#reservation-message').modal('show');
                $('#reservation-message .message').html(l('Maximum occupancy required for this room type is') + " " + max_occupancy);
                $('.confirm-customer').on('click', function () {
                    $('#reservation-message').modal('hide');
                    $('#reservation-message').on('hidden.bs.modal', function () {
                        that.$modalBody.find('[name="adult_count"]').val(1);
                        that.$modalBody.find('[name="children_count"]').val(0);
                        $('body').addClass('modal-open');
                    });

                    return false;
                });
            } else if (min_occupancy && total < min_occupancy) {
                $('#reservation-message').modal('show');
                $('#reservation-message .message').html(l('Minimum occupancy required for this room type is') + " " + min_occupancy);
                $('.confirm-customer').on('click', function () {
                    $('#reservation-message').modal('hide');
                    $('#reservation-message').on('hidden.bs.modal', function () {
                        $('body').addClass('modal-open');
                    });
                    return false;
                });
            }
        },
        // returns array of [default_rate, default_rate_info]
        _updateRate: function (roomTypeDIV) {
            var that = this;
            var rental_time = roomTypeDIV.find(".charge-with option:selected").data('rental_time');
            var rate_amount = roomTypeDIV.find(".charge-with option:selected").data('rate_amount');
            roomTypeDIV.find('[name="check_out_date"]').attr("disabled", true);
            var check_in_time = moment(roomTypeDIV.find('[name="check_in_date"]').val(), "YYYY-MM-DD HH:mm");
            roomTypeDIV.find('[name="check_out_date"]').val(check_in_time.hour((check_in_time.hour() + rental_time)).format("YYYY-MM-DD HH:mm"));
            roomTypeDIV.find("[name='rate']").attr("disabled", true);
            roomTypeDIV.find("[name='pay_period']").attr("disabled", true).val(0);
            var current_rate_plan_id = roomTypeDIV.find('.charge-with').val();
            var ratePlanID = current_rate_plan_id;

            rateArrayJSON(ratePlanID);

            function rateArrayJSON(ratePlanID) {

                var rate = ((show_decimal) ? parseFloat(rate_amount).toFixed(2) : parseInt(rate_amount));
                roomTypeDIV.find("[name='rate']").val(rate);
                $.post(getBaseURL() + "rate_plan/get_tax_amount_from_rate_plan_JSON/",
                    {
                        rate_plan_id: roomTypeDIV.find('.charge-with option:selected').val()
                    },
                    function (tax) {
                        var taxedRate = rate * (1 + parseFloat(tax.percentage)) + parseFloat(tax.flat_rate);
                        //taxedRate = Math.round(taxedRate * 100) / 100;
                        var rateIncludingTaxDiv = roomTypeDIV.find('.rate-including-tax');

                        roomTypeDIV.find("[name='taxed_rate']").val(taxedRate);

                        rateIncludingTaxDiv.text("(" + l('with tax') + ": " + number_format(taxedRate, 2, ".", "") + ")");

                        if (tax.percentage != 0) {
                            rateIncludingTaxDiv.removeClass("hidden");
                        } else {
                            rateIncludingTaxDiv.addClass("hidden");
                        }
                        that.rateWithTax = taxedRate;
                        that.rateInclusiveTax = rate * (parseFloat(tax.inclusive_tax_percentage)) + parseFloat(tax.inclusive_tax_flat_rate);
                        // that._displayRateInfo(data, tax);
                    }, 'json'
                );

            }
        },

        _updateChargeWithDDL: function (roomTypeDIV) {

            var that = this;

            var roomTypeID = roomTypeDIV.find("[name='room_type_id']").val();
            roomTypeID = roomTypeID ? roomTypeID : that.booking.current_room_type_id;

            var select = $("<select/>", {
                class: 'form-control charge-with form-group',
                //style: 'max-width: 300px;'
            })

            var chargeTypeOptionGroup = $("<optgroup/>", {
                label: l("Charge Types (Manual)")
            });

            if (!innGrid.ajaxCache.chargeTypes) {
                $.getJSON(getBaseURL() + 'booking/get_charge_types_in_JSON',
                    function (data) {
                        innGrid.ajaxCache.chargeTypes = data;
                        that._getRatePlans(that, roomTypeDIV, roomTypeID, innGrid.ajaxCache.chargeTypes, select, chargeTypeOptionGroup);
                    }
                );
            } else {
                that._getRatePlans(that, roomTypeDIV, roomTypeID, innGrid.ajaxCache.chargeTypes, select, chargeTypeOptionGroup);
            }

        },
        _getRatePlans: function (that, roomTypeDIV, roomTypeID, data, select, chargeTypeOptionGroup) {

            var get_rate_plans_callback = function (ratePlan) {

                var selectedChargeType = null;

                if (ratePlan !== '' && ratePlan !== null && ratePlan.length > 0) {

                    for (var i in ratePlan) {
                        var rental_time = "daily"

                        if (ratePlan[i].rental_hours * 1 > 0) {
                            rental_time = ratePlan[i].rental_hours
                        }

                        var rate_amount = ratePlan[i].rate_amount

                        var option = $("<option/>", {
                            value: ratePlan[i].rate_plan_id,
                            parent_rate_plan_id: ratePlan[i].parent_rate_plan_id,
                            text: ratePlan[i].rate_plan_name,
                            class: 'rate-plan',
                            "data-rental_time": rental_time,
                            "data-rate_amount": rate_amount
                        });
                        if (that.booking.rate_plan_id == ratePlan[i].rate_plan_id) {
                            option.prop("selected", true);
                            selectedChargeType = true;
                        }

                        select.append(option);
                    }
                }

                select.on('change', function () {
                    that._updateRate($(this).closest('.room-type'));
                });


                that.deferredChargeWithDDL.resolve();
                roomTypeDIV.find(".charge-with-div").find('.charge-with').remove();
                roomTypeDIV.find(".charge-with-div").append(select);


                if (that.booking.booking_id) {
                    select.prop("disabled", true);
                    roomTypeDIV.find("[name='rate']").val(that.booking.rate);
                    roomTypeDIV.find("[name='rate']").prop("disabled", true);
                    var rateIncludingTaxDiv = roomTypeDIV.find('.rate-including-tax');
                    rateIncludingTaxDiv.text("(" + l('with tax') + ": " + number_format(that.booking.taxed_rate, 2, ".", "") + ")");
                    rateIncludingTaxDiv.removeClass("hidden");
                } else {
                    that._updateRate(roomTypeDIV);
                }

            };

            var ratePlanKey = roomTypeID + '-' + that.booking.rate_plan_id;
            if (typeof that.ratePlanCache[ratePlanKey] !== "undefined" && that.ratePlanCache[ratePlanKey]) {

                get_rate_plans_callback(that.ratePlanCache[ratePlanKey]);

            } else {

                $.post(getBaseURL() + 'booking/get_rate_plans_JSON/', {
                    room_type_id: roomTypeID,
                    previous_rate_plan_id: that.booking.rate_plan_id
                }, get_rate_plans_callback, 'json');
            }

        },
        _getSelect: function (name, options, class_name) {

            var select = $("<select/>", {
                class: 'form-control ' + class_name,
                name: name,
                style: (name == 'pay_period' ? 'padding:0px 4px;' : '')
            })

            options.forEach(function (data) {
                var option = $('<option/>', {
                    value: data.id,
                    text: data.name
                });

                option.appendTo(select);
            });


            return select;

        },
        _getExtraSelect: function (label, name, options, selectedOptionID) {

            var select = $("<select/>", {
                class: 'form-control',
                name: name
            })

            options.forEach(function (data) {
                var option = $('<option/>', {
                    value: data.extra_id,
                    text: data.extra_name,
                    "data-charging-scheme": data.charging_scheme
                });

                if (data.extra_id == selectedOptionID) {
                    option.prop('selected', true);
                }

                option.appendTo(select);
            });

            return $("<div/>", {
                class: "form-group form-group-sm charging-scheme-block"
            }).append(
                $("<label/>", {
                    for: name,
                    class: "col-sm-3 control-label",
                    text: label
                })
            ).append(
                $("<div/>", {
                    class: "col-sm-9"
                }).append(select)
            )
        },
        _getHorizontalInput: function (label, name, value) {
            return $("<div/>", {
                class: "form-group form-group-sm block_" + name
            }).append(
                $("<label/>", {
                    for: name,
                    class: "col-sm-3 control-label",
                    text: label
                })
            ).append(
                $("<div/>", {
                    class: "col-sm-9"
                }).append(
                    $("<input/>", {
                        class: "form-control",
                        name: name,
                        value: value,
                        autocomplete: false
                    })
                )
            )
        },
        _getCustomBookingFieldInput: function (label, name, value, id, is_required) {

            var is_required_mark = "";
            if (is_required == 1) {
                is_required_mark = '<span class="custom_booking_field_required" style="color:red;">*</span>';
            }

            return $("<div/>", {
                class: "form-group col-sm-6"
            }).append(
                $("<label/>", {
                    for: name,
                    class: "control-label"
                }).append($("<small/>", {
                    text: label
                })).append(is_required_mark)
            ).append(
                $("<span/>")
                    .append(
                        $("<input/>", {
                            class: "form-control custom-booking-field restrict-cc-data",
                            name: name,
                            value: value,
                            'data-label': label,
                            id: id,
                            autocomplete: false
                        })
                    )
            )
        },
        _confirmationGroupDateModel: function (obj) {
            var that = this;

            $('#reservation-message').find('.confirm-customer[flag=cancel]').html(l("Apply to this booking only")).removeClass('hidden btn-danger').addClass('btn-success');
            $('#reservation-message').find('.confirm-customer[flag=ok]').html(l("Yes, change all bookings")).removeClass('btn-success').addClass('btn-warning');;
            $('#reservation-message').modal("show");
            $('#reservation-message .message-heading').text('Warning');
            $('#reservation-message .message').html(l("Would you like to apply the date change to ALL bookings that belong to this group?"));
            $('.confirm-customer').on('click', function () {

                var flag = $(this).attr('flag');
                if (flag == 'cancel') {
                    that.saveAllGroupDate = false;
                } else {
                    that.saveAllGroupDate = true;
                }

                $('#reservation-message').modal('hide');
                $('#reservation-message').on('hidden.bs.modal', function () {
                    $('body').addClass('modal-open');
                });
                $('#reservation-message').find('.confirm-customer[flag=cancel]').html(l("Cancel")).addClass('hidden');
                $('#reservation-message').find('.confirm-customer[flag=ok]').html(l("OK"));
                return false;
            });
        },
        _getAllGroupRoomBookingIds: function (data) {
            var that = this;
            // var bookingId = '';
            //var roomId ='';
            var roomBookingArr = [];
            var checkInDate = innGrid._getBaseFormattedDate($('#booking_detail').find('input[name="check_in_date"]').val());
            var checkOutDate = innGrid._getBaseFormattedDate($('#booking_detail').find('input[name="check_out_date"]').val());

            if (that.saveAllGroupDate == true) {
                var roomList = $('.room-lists .room-list-info');
                roomList.each(function () {
                    if ($(this).attr('data-booking-cancelled') == 'false') {
                        roomBookingArr.push({ 'bookingId': $(this).attr('id'), 'roomId': $(this).attr('data-room-id') });
                    }
                });
            } else if (that.saveAllGroupDate == false) {
                roomBookingArr.push({ bookingId: that.booking.booking_id, roomId: that.booking.current_room_id });
            }
            var bookingData = {
                booking: {
                    new_check_in_date: moment(innGrid._getBaseFormattedDate($('#booking_detail').find('input[name="check_in_date"]').val()) + ' ' + that.convertTimeFormat($('#booking_detail').find("[name='check_in_time']").val())).format('YYYY-MM-DD HH:mm:ss'),
                    check_out_date: moment(innGrid._getBaseFormattedDate($('#booking_detail').find("[name='check_out_date']").val()) + ' ' + that.convertTimeFormat($('#booking_detail').find("[name='check_out_time']").val())).format('YYYY-MM-DD HH:mm:ss'),
                    room_booking_ar: roomBookingArr,
                    update_date: true,
                    rooms: data.rooms
                }
            };
        }
    }; // -- Prototype

    // eventually, add an option to enter check-in & check-out date.

    $.fn.openBookingModal = function (options) {
        var body = $("body");
        // preventing against multiple instantiations
        if ((options && options.roomTypeID && jQuery.type(options.roomTypeID) != 'object') || (options && options.selected_room_id) || (options && options.id) || (options == undefined)) {
            $.data(body, 'bookingModal', new BookingModal(options));
        }
    }

    // advance caching - speedup booking modal to prefetch data
    var preFetchData = function () {

        innGrid.ajaxCache.companyBookingSources = innGrid.bookingSources;

        // prefetch charge types
        if (!innGrid.ajaxCache.commonCustomerFields || !innGrid.ajaxCache.chargeTypes) {
            $.getJSON(getBaseURL() + 'booking/get_customer_data_on_pageload',
                function (data) {
                    innGrid.ajaxCache.commonCustomerFields = data.common_customer_fields;
                    innGrid.ajaxCache.chargeTypes = data.room_charge_types;
                }
            );
        }
    }

    // prefetch data after 4s of page load
    setTimeout(preFetchData, 1000);
};

setTimeout(function () {
    bookingModalInvoker(jQuery, window, document);
}, 500);


function restrictCreditCardData(cc_number, fieldName) {

    var ccNum = cc_number;
    var visaRegEx = /^(?:4[0-9]{12}(?:[0-9]{3})?)$/;
    var mastercardRegEx = /^(?:5[1-5][0-9]{14})$/;
    var amexpRegEx = /^(?:3[47][0-9]{13})$/;
    var discovRegEx = /^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;
    var isValid = false;

    if (visaRegEx.test(ccNum)) {
        isValid = true;
    } else if (mastercardRegEx.test(ccNum)) {
        isValid = true;
    } else if (amexpRegEx.test(ccNum)) {
        isValid = true;
    } else if (discovRegEx.test(ccNum)) {
        isValid = true;
    }

    if (isValid) {
        $('#reservation-message .message-heading').text('Warning');
        $('#reservation-message .message').html('<p>' + l('Our system has detected "raw" credit card numbers in the') + ' ' + fieldName + ' ' + l('field') + '. ' + l('This is not secure and it is putting your company at risk') + '. ' +
            '<br><br>' + l('To securely store credit card data, please setup Payment Gateway Integration') + '. ' + l('We recommend using') + ' <a href="https://supportroomsy.groovehq.com/help/how-to-get-integrated-with-stripe" target="_blank">Stripe</a>.' +
            '<br/><br>' + l('Please contact us at') + ' <a href="mailto:support@minical.io" target="_blank">support@minical.io</a> ' + l('if you have any questions') + '.</p>');
        $('#reservation-message')
            .modal('show')
            .on('hidden.bs.modal', function () {
                if (($("#booking-modal").data('bs.modal') || {}).isShown)
                    $("body").addClass("modal-open");
                $('#reservation-message .message-heading').text('Message');
            });
        $('.confirm-customer').on('click', function () {
            $('#reservation-message').modal('hide');
            return false;
        });
    }
    return isValid;
}

$(document).on('blur', '.restrict-cc-data', function () {
    innGrid.restrictedCreditCardData = localStorage.getItem('restrictedCreditCardData');
    if (innGrid.restrictedCreditCardData) {
        return;
    }
    var fieldName = $(this).data('label');
    var str = $(this).val();
    var digits = str ? str.replace(/\ /g, '').match(/\d+/g) : null;
    if (digits && digits.length > 0) {
        digits.forEach(function (digit) {
            innGrid.restrictedCreditCardData = restrictCreditCardData(digit, fieldName);
            localStorage.setItem('restrictedCreditCardData', innGrid.restrictedCreditCardData);
        });
    }
});
