Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"
  config.vm.hostname = "forme-ci"
  config.vm.boot_timeout = 600

  config.vm.network "forwarded_port", guest: 8080, host: 8086
  config.vm.network "forwarded_port", guest: 9000, host: 9000
  config.vm.network "forwarded_port", guest: 30300, host: 30300
  config.vm.network "forwarded_port", guest: 30090, host: 30090

  config.vm.provider "virtualbox" do |vb|
    vb.cpus = 3
    vb.memory = 6144
  end

  config.vm.provision "shell", path: "bootstrap.sh"
end
