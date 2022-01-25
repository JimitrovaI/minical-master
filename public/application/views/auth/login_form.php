<div class="col-md-3"></div>
<div class="col-md-6">
	<form action="<?php echo base_url(); ?>auth/login" class="text-center" method="post" accept-charset="utf-8" style="  max-width: 400px;
    margin: auto;">

		<a href="<?php echo base_url(); ?>">
			<?php
			if ($whitelabel_detail && $whitelabel_detail['logo']) {
				$image_url = base_url() . 'images/' . $whitelabel_detail['logo'];
				echo '<img src="' . $image_url . '" style="max-width: 200px;">';
			}
			?>
		</a>

		<h2 class="form-signin-heading"><?php if ($whitelabel_detail) {
											echo ucfirst($whitelabel_detail['name']);
										} else {
											echo $this->config->item('branding_name');
										} ?> Login</h2>

		<?php $email = '';
		$password = '';

		?>

		<div style="color: red;">
			<?php echo isset($errors['incorrect_email']) && $errors['incorrect_email'] ? $errors['incorrect_email'] : ''; ?>
			<?php echo isset($errors['password']) && $errors['password'] ? $errors['password'] : ''; ?>
		</div>

		<div class="form-group">
			<label for="email" class="sr-only">Email</label>
			<input title="email" class="form-control" type="text" name="login" placeholder="Email" id="Email" maxlength="80" value="<?php echo $email; ?>" required>
		</div>

		<div class="form-group">
			<label for="inputPassword" class="sr-only">Password</label>
			<input type="password" id="password" name="password" class="form-control" placeholder="Password" required value="<?php echo $password; ?>">
		</div>

		<div class="form-group">
			<input class="btn btn-lg btn-primary btn-block" id="log-in-button" type="submit" name="submit" value="Log In">
		</div>

		<br />
		<br />
	</form>
</div>
<div class="col-md-3"></div>
