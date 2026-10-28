#!/bin/sh
set -eu
ssh-keygen -q -t ed25519 -N '' -f /etc/ssh/ssh_host_ed25519_key
install -d -m 700 -o tomato -g tomato /home/tomato/.ssh
install -m 600 -o tomato -g tomato /fixture-key.pub /home/tomato/.ssh/authorized_keys
install -d -m 700 -o tomato -g tomato /home/tomato/workspace
exec /usr/sbin/sshd -D -e -f /etc/ssh/sshd_config
