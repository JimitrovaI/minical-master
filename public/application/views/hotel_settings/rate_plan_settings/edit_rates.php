<div class="page-header h3">
    <a href="javascript:history.back()" class="btn btn-light">
        <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
        <?php echo l('Back', true); ?>
    </a>

    <?php echo l('Edit Rates for', true); ?>
    <a href="<?php echo base_url() . "settings/rates/rate_plans#" . $rate_plan_id; ?>">
        <?php echo $rate_plan_name . " (" . $room_type['name'] . ") "; ?>
    </a>
</div>
<input name="tab_identification" id="tab_identification" type='hidden' value="1" />
<input name="room_type_id" type='hidden' value="<?php if (!empty($room_type_id)) echo $room_type_id; ?>" />
<input name='rate_plan_id' value='<?php echo $rate_plan_id; ?>' hidden />


<!-- Modal -->
<div class="modal fade rate-data" id="create_rate_modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="myModalLabel"><?php echo l('Edit Rate', true); ?></h4>

            </div>

            <div class="panel panel-default">
                <div class="panel-body">
                    <div class="col-sm-12 text-center">
                        <div class="form-inline">
                            <div class="form-group">
                                <?php echo l('Modify rates between', true); ?> &nbsp;
                                <input name='date_start' id='date_start' class='date form-control' value='<?php echo $today; ?>' placeholder="<?php echo l('Start Date', true); ?>">
                                &nbsp; <?php echo l('and', true); ?> &nbsp;
                                <?php
                                $end_placeholder = l('Forever', true);
                                ?>
                                <input name='date_end' id='date_end' class='date form-control' value='<?php //echo $next_year;  
                                                                                                        ?>' placeholder="<?php echo $end_placeholder; ?>">
                            </div>
                        </div>
                    </div>
                    <div class=""><br /><br />

                        <ul class="nav nav-tabs">
                            <li class="active"><a href="#general_rates" id="general_rates_tab"><?php echo l('Bulk Update', true); ?></a></li>
                            <li><a href="#day_specific_rates" id="day_specific_rates_tab"><?php echo l('Daily Rates', true); ?></a></li>

                        </ul>


                    </div>

                </div>
            </div>
            <div class="">
                <div class="tab-content">
                    <div id="general_rates" class="tab-pane fade in active">
                        <div class="modal-body" id="image_edit_modal_body">
                            <div class='form-horizontal'>
                                <label style="padding-top: 30px;" for="" class="col-sm-3">

                                </label>
                                <?php
                                $input_names = array(
                                    '1 ' . l('Adult', true) => 'adult_1_rate',
                                    '2 ' . l('Adults', true) => 'adult_2_rate',
                                    '3 ' . l('Adults', true) => 'adult_3_rate',
                                    '4 ' . l('Adults', true) => 'adult_4_rate',
                                    l('Additional Adults', true) => 'additional_adult_rate',
                                    l('Additional Children', true) => 'additional_child_rate',
                                    l('Minimum LOS', true) => 'minimum_length_of_stay',
                                    l('Maximum LOS', true) => 'maximum_length_of_stay',
                                    l('Minimum LOS Arrival', true) => 'minimum_length_of_stay_arrival',
                                    l('Maximum LOS Arrival', true) => 'maximum_length_of_stay_arrival',
                                );

                                $index = 1;
                                foreach ($input_names as $label => $input_name) :
                                ?>
                                    <div class="form-group <?= ($input_name == "minimum_length_of_stay_arrival" || $input_name == "maximum_length_of_stay_arrival") ? "hidden" : ""; ?>">

                                        <div class="col-sm-12">

                                            <div class="row seven-cols">

                                                <div class="input-group input-group-sm">

                                                    <div class="col-sm-12 no-padding">

                                                        <div class="row text-left">
                                                            <div class="col-xs-3">
                                                                <div class="row">
                                                                    <div class="text-right">
                                                                        <label style="padding-top: 5px;" for="<?php echo $input_name; ?>" class="">
                                                                            <?php echo $label; ?>
                                                                        </label><br />
                                                                    </div>

                                                                </div>
                                                            </div>
                                                            <div class="col-xs-6">
                                                                <div class="row">
                                                                    <div class="col-xs-12">
                                                                        <div class="input-group">
                                                                            <input type="text" name="<?php echo $input_name; ?>" class="form-control modifiable" aria-label="...">

                                                                        </div><!-- /input-group -->
                                                                        <br /><br />
                                                                    </div>

                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <br />
                                    <?php $index = $index + 1; ?>
                                <?php
                                endforeach;
                                ?>

                            </div>
                        </div>
                    </div>
                    <div id="day_specific_rates" class="tab-pane fade">
                        <div class="modal-body" id="image_edit_modal_body2">
                            <div class='form-horizontal m-120'>
                                <label style="padding-top: 30px;" for="" class="col-sm-3">

                                </label>
                                <?php
                                $input_names = array(
                                    '1 ' . l('Adult', true) => 'adult_1_rate',
                                    '2 ' . l('Adults', true) => 'adult_2_rate',
                                    '3 ' . l('Adults', true) => 'adult_3_rate',
                                    '4 ' . l('Adults', true) => 'adult_4_rate',
                                    l('Additional Adults', true) => 'additional_adult_rate',
                                    l('Additional Children', true) => 'additional_child_rate',
                                    l('Minimum LOS', true) => 'minimum_length_of_stay',
                                    l('Maximum LOS', true) => 'maximum_length_of_stay',
                                    l('Minimum LOS Arrival', true) => 'minimum_length_of_stay_arrival',
                                    l('Maximum LOS Arrival', true) => 'maximum_length_of_stay_arrival',
                                );

                                $index = 1;
                                foreach ($input_names as $label => $input_name) :
                                ?>
                                    <div class="form-group <?= ($input_name == "minimum_length_of_stay_arrival" || $input_name == "maximum_length_of_stay_arrival") ? "hidden" : ""; ?>">

                                        <div class="col-sm-12">

                                            <div class="row seven-cols">

                                                <!----start-7-colum------>

                                                <!---End-7-colum--------->

                                                <div class="input-group input-group-sm">

                                                    <div class="col-sm-12 no-padding">
                                                        <?php if ($index == 1) { ?>
                                                            <div class="row">
                                                                <div class="col-xs-6">
                                                                    <div class="row">
                                                                        <div class="col-xs-3">

                                                                        </div>
                                                                        <div class="col-xs-3">
                                                                            <label> <?php echo l('Mon', true); ?> </label>
                                                                        </div>
                                                                        <div class="col-xs-3">
                                                                            <label> <?php echo l('Tue', true); ?> </label>
                                                                        </div>
                                                                        <div class="col-xs-3">
                                                                            <label> <?php echo l('Wed', true); ?> </label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="col-xs-6">
                                                                    <div class="row">
                                                                        <div class="col-xs-3">
                                                                            <label> <?php echo l('Thu', true); ?> </label>
                                                                        </div>
                                                                        <div class="col-xs-3">
                                                                            <label> <?php echo l('Fri', true); ?> </label>
                                                                        </div>
                                                                        <div class="col-xs-3">
                                                                            <label> <?php echo l('Sat', true); ?> </label>
                                                                        </div>
                                                                        <div class="col-xs-3">
                                                                            <label> <?php echo l('Sun', true); ?> </label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div><br />
                                                        <?php } ?>
                                                        <div class="row text-center">
                                                            <div class="col-xs-6">
                                                                <div class="row">
                                                                    <div class="col-xs-3 text-right">
                                                                        <label style="padding-top: 5px;" for="<?php echo $input_name; ?>" class="">
                                                                            <?php echo $label; ?>
                                                                        </label><br />
                                                                    </div>
                                                                    <div class="col-xs-3">
                                                                        <div class="input-group">
                                                                            <input type="text" name="<?php echo $input_name; ?>_mon" id="<?php echo $input_name; ?>_mon" class="form-control modifiable" aria-label="...">


                                                                            <div class="input-group-btn">



                                                                                <span class="input-group-btn">
                                                                                    <input style="display: none;" type=checkbox name='<?php echo $input_name; ?>_all' id='all_<?php echo $input_name; ?>' class="copy_to_all">
                                                                                    <label class="btn btn-default" for="all_<?php echo $input_name; ?>"><span title="Copy to all"><i class="fa fa-caret-right" aria-hidden="true"></i></span>
                                                                                    </label>

                                                                                </span>

                                                                                <!--</ul>-->
                                                                            </div><!-- /btn-group -->
                                                                        </div><!-- /input-group -->
                                                                        <br /><br />
                                                                    </div>
                                                                    <div class="col-xs-3">
                                                                        <div class="input-group">
                                                                            <input type="text" name="<?php echo $input_name; ?>_tue" id="<?php echo $input_name; ?>_tue" class="form-control modifiable" aria-label="...">
                                                                            <div class="input-group-btn">

                                                                            </div><!-- /btn-group -->
                                                                        </div><!-- /input-group -->
                                                                        <br /><br />
                                                                    </div>
                                                                    <div class="col-xs-3">
                                                                        <div class="input-group">
                                                                            <input type="text" name="<?php echo $input_name; ?>_wed" id="<?php echo $input_name; ?>_wed" class="form-control modifiable" aria-label="...">
                                                                            <div class="input-group-btn">

                                                                            </div><!-- /btn-group -->
                                                                        </div><!-- /input-group -->
                                                                        <br /><br />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div class="col-xs-6">
                                                                <div class="row">
                                                                    <div class="col-xs-3">
                                                                        <div class="input-group">
                                                                            <input type="text" name="<?php echo $input_name; ?>_thu" id="<?php echo $input_name; ?>_thu" class="form-control modifiable" aria-label="...">
                                                                            <div class="input-group-btn">

                                                                            </div><!-- /btn-group -->
                                                                        </div><!-- /input-group -->
                                                                        <br /><br />
                                                                    </div>
                                                                    <div class="col-xs-3">
                                                                        <div class="input-group">
                                                                            <input type="text" name="<?php echo $input_name; ?>_fri" id="<?php echo $input_name; ?>_fri" class="form-control modifiable" aria-label="...">
                                                                            <div class="input-group-btn">

                                                                            </div><!-- /btn-group -->
                                                                        </div><!-- /input-group -->
                                                                        <br /><br />
                                                                    </div>
                                                                    <div class="col-xs-3">
                                                                        <div class="input-group">
                                                                            <input type="text" name="<?php echo $input_name; ?>_sat" id="<?php echo $input_name; ?>_sat" class="form-control modifiable" aria-label="...">
                                                                            <div class="input-group-btn">

                                                                            </div><!-- /btn-group -->
                                                                        </div><!-- /input-group -->
                                                                        <br /><br />
                                                                    </div>
                                                                    <div class="col-xs-3">
                                                                        <div class="input-group">
                                                                            <input type="text" name="<?php echo $input_name; ?>_sun" id="<?php echo $input_name; ?>_sun" class="form-control modifiable" aria-label="...">
                                                                            <div class="input-group-btn">

                                                                            </div><!-- /btn-group -->
                                                                        </div><!-- /input-group -->
                                                                        <br /><br />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <br />
                                    <?php $index = $index + 1; ?>
                                <?php
                                endforeach;
                                ?>

                                <div class="clearfix"></div>

                            </div>
                        </div>
                    </div>

                </div>
            </div>
            <div class="modal-footer">
                <button class='btn btn-primary' id='modify_rates_button'><?php echo l('Save', true); ?></button>
                <button type="button" class="btn btn-default" data-dismiss="modal"><?php echo l('Close', true); ?></button>
            </div>
        </div>
    </div>
</div>
<!-- Supplied Rate Modal -->
<div class="modal fade rate-data" id="create_supplied_rate_modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="myModalLabel"><?php echo l('Edit Supplied Rate', true); ?></h4>

            </div>

            <div class="panel panel-default">
                <div class="panel-body">
                    <div class="col-sm-12 text-center">
                        <div class="form-inline">
                            <div class="form-group">
                                <?php echo l('Modify supplied rates between ', true); ?>
                                <input name='supplied_rate_date_start' id='supplied_rate_date_start' class='date form-control' value='<?php echo $today; ?>'>
                                <?php echo l('and', true); ?>
                                <input name='supplied_rate_date_end' id='supplied_rate_date_end' class='date form-control' value='<?php //echo $next_year;  
                                                                                                                                    ?>'>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-body" id="image_edit_modal_body1">
                <div class='form-horizontal m-121'>
                    <label style="padding-top: 30px;" for="" class="col-sm-3">

                    </label>
                    <?php
                    $input_names = array(
                        '1 ' . l('Adult') => 'supplied_adult_1_rate',
                        '2 ' . l('Adults') => 'supplied_adult_2_rate',
                        '3 ' . l('Adults') => 'supplied_adult_3_rate',
                        '4 ' . l('Adults') => 'supplied_adult_4_rate',
                    );

                    $index = 1;
                    foreach ($input_names as $label => $input_name) :
                    ?>
                       
                       
                        <div class="form-group">

                            <div class="col-sm-12">

                                <div class="row seven-cols">

                                    <!----start-7-colum------>

                                    <!---End-7-colum--------->

                                    <div class="input-group input-group-sm">

                                        <div class="col-sm-12 no-padding">
                                            <?php if ($index == 1) { ?>
                                                <div class="row">
                                                    <div class="col-xs-6">
                                                        <div class="row">
                                                            <div class="col-xs-3">

                                                            </div>
                                                            <div class="col-xs-3">
                                                                <label> <?php echo l('Mon', true); ?> </label>
                                                            </div>
                                                            <div class="col-xs-3">
                                                                <label> <?php echo l('Tue', true); ?> </label>
                                                            </div>
                                                            <div class="col-xs-3">
                                                                <label> <?php echo l('Wed', true); ?> </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="col-xs-6">
                                                        <div class="row">
                                                            <div class="col-xs-3">
                                                                <label> <?php echo l('Thu', true); ?> </label>
                                                            </div>
                                                            <div class="col-xs-3">
                                                                <label> <?php echo l('Fri', true); ?> </label>
                                                            </div>
                                                            <div class="col-xs-3">
                                                                <label> <?php echo l('Sat', true); ?> </label>
                                                            </div>
                                                            <div class="col-xs-3">
                                                                <label> <?php echo l('Sun', true); ?> </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div><br />
                                            <?php } ?>
                                            <div class="row text-center">
                                                <div class="col-xs-6">
                                                    <div class="row">
                                                        <div class="col-xs-3 text-right">
                                                            <label style="padding-top: 5px;" for="<?php echo $input_name; ?>" class="">
                                                                <?php echo $label; ?>
                                                            </label><br />
                                                        </div>
                                                        <div class="col-xs-3">
                                                            <div class="input-group">
                                                                <input type="text" name="<?php echo $input_name; ?>_mon" id="<?php echo $input_name; ?>_mon" class="form-control modifiable" aria-label="...">


                                                                <div class="input-group-btn">

                                                                  

                                                                    <span class="input-group-btn">
                                                                        <input style="display: none;" type=checkbox name='<?php echo $input_name; ?>_all' id='all_<?php echo $input_name; ?>' class="copy_to_all">
                                                                        <label class="btn btn-default" for="all_<?php echo $input_name; ?>"><span title="Copy to all"><i class="fa fa-caret-right" aria-hidden="true"></i></span>
                                                                        </label>

                                                                    </span>

                                                                    <!--</ul>-->
                                                                </div><!-- /btn-group -->
                                                            </div><!-- /input-group -->
                                                            <br /><br />
                                                        </div>
                                                        <div class="col-xs-3">
                                                            <div class="input-group">
                                                                <input type="text" name="<?php echo $input_name; ?>_tue" id="<?php echo $input_name; ?>_tue" class="form-control modifiable" aria-label="...">
                                                                <div class="input-group-btn">
                                                                   
                                                                </div><!-- /btn-group -->
                                                            </div><!-- /input-group -->
                                                            <br /><br />
                                                        </div>
                                                        <div class="col-xs-3">
                                                            <div class="input-group">
                                                                <input type="text" name="<?php echo $input_name; ?>_wed" id="<?php echo $input_name; ?>_wed" class="form-control modifiable" aria-label="...">
                                                                <div class="input-group-btn">
                                                                    
                                                                </div><!-- /btn-group -->
                                                            </div><!-- /input-group -->
                                                            <br /><br />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-xs-6">
                                                    <div class="row">
                                                        <div class="col-xs-3">
                                                            <div class="input-group">
                                                                <input type="text" name="<?php echo $input_name; ?>_thu" id="<?php echo $input_name; ?>_thu" class="form-control modifiable" aria-label="...">
                                                                <div class="input-group-btn">
                                                                   
                                                                </div><!-- /btn-group -->
                                                            </div><!-- /input-group -->
                                                            <br /><br />
                                                        </div>
                                                        <div class="col-xs-3">
                                                            <div class="input-group">
                                                                <input type="text" name="<?php echo $input_name; ?>_fri" id="<?php echo $input_name; ?>_fri" class="form-control modifiable" aria-label="...">
                                                                <div class="input-group-btn">
                                                                  
                                                                </div><!-- /btn-group -->
                                                            </div><!-- /input-group -->
                                                            <br /><br />
                                                        </div>
                                                        <div class="col-xs-3">
                                                            <div class="input-group">
                                                                <input type="text" name="<?php echo $input_name; ?>_sat" id="<?php echo $input_name; ?>_sat" class="form-control modifiable" aria-label="...">
                                                                <div class="input-group-btn">
                                                                    
                                                                </div><!-- /btn-group -->
                                                            </div><!-- /input-group -->
                                                            <br /><br />
                                                        </div>
                                                        <div class="col-xs-3">
                                                            <div class="input-group">
                                                                <input type="text" name="<?php echo $input_name; ?>_sun" id="<?php echo $input_name; ?>_sun" class="form-control modifiable" aria-label="...">
                                                                <div class="input-group-btn">
                                                                    
                                                                </div><!-- /btn-group -->
                                                            </div><!-- /input-group -->
                                                            <br /><br />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                        <br />
                    <?php
                        $index = $index + 1;
                    endforeach;
                    ?>

                </div>
            </div>
            <div class="modal-footer">
                <button class='btn btn-primary' id='modify_supplied_rates_button'><?php echo l('Save', true); ?></button>
                <button type="button" class="btn btn-default" data-dismiss="modal"><?php echo l('Close', true); ?></button>
            </div>
        </div>
    </div>
</div>

<div class="main-card mb-3 card m-014">
    <div class="card-body">
        <input name="today" type='hidden' value="<?php echo $today; ?>" />
        <button id='modify-rates' class="btn btn-primary">
            <?php echo l('Modify Rates', true); ?>
        </button>
        <?php
        if ($this->session->userdata('user_role') == "is_admin") {
        ?>
            <button id='modify-supplied-rates' class="btn btn-primary">
                <?php echo l('Modify Supplied Rates', true); ?>
            </button>
        <?php
        }
        ?>

        <div class="pull-right btn-fix-001">
            <span class='btn btn-light' id='show-previous-month'>
                <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
                <?php echo l('Previous 4 weeks', true); ?>
            </span>
            <span class='btn btn-light' id='show-next-month'>
                <?php echo l('Next 4 weeks', true); ?>
                <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>
            </span>
        </div>
        <br /><br />
        <div class="table-responsive">
            <table id='rate-detail-table' class="table table-bordered text-right">
            </table>
        </div>
    </div>
</div>