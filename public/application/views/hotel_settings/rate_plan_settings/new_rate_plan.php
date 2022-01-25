<div class="panel panel-default new-rate-plan-modal rate-plan-div new-panel" id="<?php echo $rate_plan_id; ?>">
	<div class="panel-body form-horizontal">
		<div class="alert alert-success hidden updated-message" role="alert"><?php echo l('Updated', true); ?>!</div>
		<div class="alert alert-danger hidden error-message" role="alert">
			<?php echo l('Please enter all valid details', true); ?>!
		</div>

		<div class="form-group">
			<label class="col-sm-3 control-label">
				<?php echo l('Rate Plan Name', true); ?>
			</label>
			<div class="col-sm-9">
				<input name="rate-plan-name" class="form-control" type="text" value="<?php echo $rate_plan_name; ?>" />
			</div>
		</div>

		<div class="form-group">
			<label class="col-sm-3 control-label">
				<?php echo l('Room types', true); ?>
			</label>
			<div class="col-sm-9">
				<select name="room-type-id" class="select-room-types required" multiple="multiple" style="width: 100%;">
					<option disabled>--<?php echo l('Select Room Type', true); ?>--</option>
					<?php
					foreach ($room_types as $room_type) {
						echo "<option value='" . $room_type['id'] . "' ";
						if ($room_type_id == $room_type['id']) {
							echo " SELECTED=SELECTED ";
						}
						echo ">" . $room_type['name'] . "</option>\n";
					}	
					?>
				</select>
			</div>

		</div>


		<div class="form-group">
			<label class="col-sm-3 control-label">
				<?php echo l('Charge Type', true); ?>
			</label>
			<div class="col-sm-6">
				<select name="charge-type-id" class="form-control">
					<?php if (!$allow_free_bookings) {
						echo '<option>--Select Charge Type--</option>';
					} ?>
					<?php
					foreach ($charge_types as $charge_type) {
						echo "<option value='" . $charge_type['id'] . "' ";
						if ($charge_type_id == $charge_type['id']) {
							echo " SELECTED=SELECTED ";
						}
						echo ">" . $charge_type['name'] . "</option>\n";
					}
					?>
					<?php if ($allow_free_bookings) {
						echo '<option value="">' . l("None (can be booked for free)", true) . '</option>';
					} ?>
				</select>
			</div>
		</div>

		<div class="form-group">
			<label class="col-sm-3 control-label">
				<?php echo l('Time (h)', true); ?>
			</label>
			<div class="col-sm-6">
				<input class="form-control" name="rental-hours" min="0" type="number" placeholder="Enter Rental Hours" value="<?php echo empty($rate_plan['rental_hours']) ? "" : $rate_plan['rental_hours'] ?>" />
			</div>
		</div>

		<div class="form-group">
			<label class="col-sm-3 control-label">
				<?php echo l('Rate (DOP)', true); ?>
			</label>
			<div class="col-sm-6">
				<input class="form-control" name="rate-amount" min="0" type="number" placeholder="Enter Rental Rate" value="<?php echo empty($rate_plan['rental_hours']) ? "" : $rate_plan['rental_hours'] ?>" />
			</div>
		</div>

	</div>
</div>
<style type="text/css">
	.select2-drop.select2-drop-active {
		z-index: 2147483647 !important;
	}

	.rate-plan-div.new-panel {
		border: 0;
		box-shadow: unset;
	}

	#image_edit_modal,
	#croppicModal {
		z-index: 99999999;
	}
</style>