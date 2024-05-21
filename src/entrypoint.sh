#!/bin/bash

directory="/etc/wireguard"

if [ ! -e $directory ]; then
    private=$(wg genkey)
    public=$(echo $private | wg pubkey)
    conf=wg0
    int=eth0
	cat > $directory/$conf.conf <<EOL
[Interface]
SaveConfig = true
Address = $WG_ADDRESS
ListenPort = $WG_PORT
PrivateKey = $private

PostUp = iptables -t nat -A POSTROUTING -s $WG_ADDRESS -o $int -j MASQUERADE
PostUp = iptables -A INPUT -p udp -m udp --dport $WG_PORT -j ACCEPT
PostUp = iptables -A FORWARD -i $conf -j ACCEPT
PostUp = iptables -A FORWARD -o $conf -j ACCEPT

PostDown = iptables -D INPUT -p udp -m udp --dport $WG_PORT -j ACCEPT
PostDown = iptables -D FORWARD -i $conf -j ACCEPT
PostDown = iptables -D FORWARD -o $conf -j ACCEPT
PostDown = iptables -t nat -A POSTROUTING -s $WG_ADDRESS -o $int -j MASQUERADE
EOL
    chmod 700 $directory/$conf.conf
fi

cd /app && ./wgd.sh start