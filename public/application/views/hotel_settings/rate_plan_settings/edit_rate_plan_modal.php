<div class="panel panel-default rate-plan-div" id="<?php echo $rate_plan['rate_plan_id']; ?>">
	<div class="panel-body form-horizontal">

		<div class="alert alert-success hidden updated-message" role="alert"><?php echo l('Updated', true); ?>!</div>

		<div class="form-group">
			<label class="col-sm-3 control-label">
				<?php echo l('Rate Plan Name', true); ?>
			</label>
			<div class="col-sm-6">
				<input name="rate-plan-name" class="form-control" type="text" value="<?php echo $rate_plan['rate_plan_name']; ?>" />
			</div>

		</div>

		<div class="form-group">
			<label class="col-sm-3 control-label">
				<?php echo l('Room types', true); ?>
			</label>
			<div class="col-sm-9">
				<select name="room-type-id" class="form-control">
					<option>--<?php echo l('Select Room Type', true); ?>--</option>
					<?php
					foreach ($room_types as $room_type) {
						echo "<option value='" . $room_type['id'] . "' ";
						if ($rate_plan['room_type_id'] == $room_type['id']) {
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
					<?php if (!$this->allow_free_bookings) {
						echo '<option>--' . l('Select Charge Type', true) . '--</option>';
					} ?>
					<?php
					foreach ($charge_types as $charge_type) {
						echo "<option value='" . $charge_type['id'] . "' ";
						if ($rate_plan['charge_type_id'] == $charge_type['id']) {
							echo " SELECTED=SELECTED ";
						}
						echo ">" . $charge_type['name'] . "</option>\n";
					}
					?>
					<?php if ($this->allow_free_bookings) {
						echo '<option ' . ($rate_plan['charge_type_id'] ? '' : 'SELECTED=SELECTED') . ' value="">' . l('None (can be booked for free)', true) . '</option>';
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
				<input class="form-control" name="rate-amount" min="0" type="number" placeholder="Enter Rental Rate" value="<?php echo empty($rate_plan['rate_amount']) ? "" : $rate_plan['rate_amount'] ?>" />
			</div>
		</div>

	</div>
</div>