<div class="table-responsive">
	<table class="table table-hover rooms rate-plans-table">
		<thead>
			<tr>
				<th>
					<?php echo l('Name'); ?>
				</th>
				<th>
					<?php echo l(' Room Type'); ?>
				</th>
				<th>
					<?php echo l('Charge Type'); ?>
				</th>

				<th>
					<?php echo l('Hours'); ?>
				</th>

				<th>
					<?php echo l('Rate'); ?>
				</th>
				<th style="text-align: center;">
					<?php echo l('Action'); ?>
				</th>

				<th></th>
			</tr>
		</thead>
		<tbody>
			<?php if (is_null($rate_plans))
				return;
			$count = 1;
			foreach ($rate_plans as $rate_plan) : ?>
				<tr class="rate-plan-row-<?php echo $rate_plan['rate_plan_id']; ?>" id="<?php echo $rate_plan['rate_plan_id']; ?>">
					<td>
						<?php echo $rate_plan['rate_plan_name']; ?>
					</td>
					<td>
						<?php
						foreach ($room_types as $room_type) {

							if ($rate_plan['room_type_id'] == $room_type['id'])

								echo $room_type['name'];
						}
						?>
					</td>
					<td>

						<?php
						foreach ($charge_types as $charge_type) {

							if ($rate_plan['charge_type_id'] == $charge_type['id']) {
								echo $charge_type['name'];
							}
						}
						?>
					</td>

					<td>
						<?php
						echo $rate_plan['rental_hours'] . " h";
						?>
					</td>

					<td>
						<?php
						echo ($rate_plan['rate_amount']? $rate_plan['rate_amount']:"0.00") . " DOP";
						?>
					</td>
					<td >
						<div class="btn-group pull-right" role="group">
							<button class="btn btn-success btn-sm edit-new-rate-plan" data-room_type_id="<?= $rate_plan['room_type_id']; ?>" id='<?php echo $rate_plan['rate_plan_id'] ?>'> <?php echo l('Edit', true); ?></button>

							<button type="button" class="btn btn-sm btn-danger delete-rate-plan-button" id=<?php echo $rate_plan['rate_plan_id']; ?>>
								<?php echo l('Delete', true); ?>
							</button>
						</div>
					</td>
				</tr>
			<?php endforeach; ?>
		</tbody>
	</table>
</div>
<input type="hidden" name="subscription_level" class="subscription_level" value="<?php echo $this->company_subscription_level; ?>">
<input type="hidden" name="subscription_state" class="subscription_state" value="<?php echo $this->company_subscription_state; ?>">
<input type="hidden" name="limit_feature" class="limit_feature" value="<?php echo $this->company_feature_limit; ?>">
<div class="modal fade" id="edit-rate-plan" data-backdrop="static" data-keyboard="false">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h4 class="modal-title" style="text-align: center;">
					<?php echo l('Edit Rate Plan', true); ?>
					<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				</h4>
			</div>
			<div class="modal-body">
			</div>
			<div class="modal-footer">
				<div class="col-md-12">

					<div class="form-group">
						<div class="col-sm-12 text-right" style="float: right">
							<button type="button" class="btn btn-danger" data-dismiss="modal">
								<?php echo l('Cancel', true); ?>
							</button>
							<button class="btn btn-success update-rate-plan-button" count="<?php echo $count; ?>">
								<?php echo l('Update Rate Plan', true); ?>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div><!-- /.modal-content -->
	</div><!-- /.modal-dialog -->
</div><!-- /.modal -->