<style>
    .main {
        padding-right: 0px !important;
        padding-left: 0px !important;
    }

    .footer {
        height: 40px !important;
        margin-top: 20px !important;
    }

    .wrapper {
        background-color: #fff !important;
    }

    div#processing-modal {
        z-index: 9999;
    }
</style>

<div id="dialogProcessingRequest">
    <span alt="processing_request_please_wait" title="processing_request_please_wait">Processing request. Please wait...</span>
</div>


<div class="modal" id="registeration-modal" data-backdrop="static" data-keyboard="false" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true" style="margin-top: -7px;">
    <div class="modal-dialog">
        <div class="modal-content">
            <form action="" method="post" accept-charset="utf-8">
                <div class="text-center" style="padding: 15px;">
                    <div class="panel panel-success">
                        <div>
                            <h3 style="padding-top: 7px;">
                                Create an admin account
                            </h3>
                            <h5 style="padding-top: 10px;">Step 2 of 3</h5>
                        </div>
                        <div class="panel-body form-horizontal">
                            <div class="form-group">
                                <label for="email" class="col-sm-3 control-label">Email: </label>
                                <div class="col-sm-9">
                                    <input name="email" class="form-control" type="text" placeholder="Email" autocomplete="off" value="<?php echo set_value('email'); ?>" />
                                </div>

                            </div>
                            <div class="form-group">
                                <label for="email" class="col-sm-3 control-label">Password: </label>
                                <div class="col-sm-9">
                                    <input name="password" class="form-control" type="password" placeholder="Password" autocomplete="off" value="<?php echo set_value('password'); ?>" />
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="email" class="col-sm-3 control-label"></label>
                                <div class="col-sm-9">
                                    <input name="accept_tnc" hidden type="checkbox" value="1" checked />
                                    <input type="submit" class="btn btn-lg btn-success btn-block register_submit_form" value="Next Step" name="register_submit_form" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div><!-- /.modal-content -->
    </div><!-- /.modal-dialog -->
</div><!-- /.modal -->


<script src="https://code.jquery.com/jquery-1.10.2.js"></script>
<script>
    var isInitialized = false;

    function initialize() {

        isInitialized = true;

        $('#registeration-modal').modal('show');
    }


    $(window).load(function() {
        if (!isInitialized) initialize();
    });
    // fallback
    $(document).ready(function() {
        if (!isInitialized) initialize();
    });

    $(document).on('click', '.register_submit_form', function(e) {
        e.preventDefault();

        $('.register_submit_form').attr('disabled', true).val('Processing...');

        var email = $("input[name=email]").val();
        var password = $("input[name=password]").val();
        var url = '<?php echo 'https://' . $_SERVER['HTTP_HOST']; ?>';

        if (email == '') {
            alert('The Email field is required.');
            $('.register_submit_form').attr('disabled', false).val('Next Step');
            return false;
        }

        $.ajax({
            type: "POST",
            url: getBaseURL() + 'auth/new_register_AJAX',
            data: {
                email: email,
                password: password,
            },
            success: function(data) {
                if (data == 'success') {
                    window.location.href = getBaseURL() + 'booking/';

                } else if (data == 'loggedin') {
                    window.location.href = getBaseURL() + 'booking/';
                } else {
                    alert(data);
                    $('.register_submit_form').attr('disabled', false).val('Next Step');
                }
            },
            error: function(err) {
                $('.register_submit_form').attr('disabled', false).val('Next Step');
                console.log('in error');
            }
        });
    });
</script>