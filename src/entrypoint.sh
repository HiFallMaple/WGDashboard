#!/bin/bash

directory="/etc/wireguard"
conf=wg0

if [ ! -f $directory/$conf.conf ]; then
    private=$(wg genkey)
    public=$(echo $private | wg pubkey)
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
else
    echo "wg0.conf already exist."
fi

wg-quick up wg0
cd /app && ./wgd.sh start