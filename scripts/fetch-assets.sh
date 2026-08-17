#!/usr/bin/env bash
# Descarga imagenes de stock (Unsplash) usadas solo en el prototipo.
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)/public/img"
mkdir -p "$DIR"

dl() { # nombre id ancho alto
  curl -sSL -o "$DIR/$1.jpg" "https://images.unsplash.com/photo-$2?w=$3&h=$4&fit=crop&q=80"
}

dl hero            1570172619644-dfd03ed5d881 1800 1100
dl nosotros        1590439471364-192aa70c0b53 1200 900
dl cta             1519824145371-296894a0daa9 1800 900

dl trat-limpieza   1616394584738-fc6e612e71b9 900 700
dl trat-hifu       1761718209694-70031ee64f82 900 700
dl trat-botox      1512290923902-8a9f81dc236c 900 700
dl trat-plasma     1629198688000-71f23e745b6e 900 700
dl trat-hidro      1544161515-4ab6ce6db874   900 700
dl trat-drenaje    1519824145371-296894a0daa9 900 700
dl trat-peeling    1552693673-1bf958298935   900 700
dl trat-dermapen   1519823551278-64ac92734fb1 900 700
dl trat-radio      1570172619644-dfd03ed5d881 900 700
dl trat-tens       1515377905703-c4788e51af15 900 700

dl prod-1 1631730359585-38a4935cbec4 800 800
dl prod-2 1620916566398-39f1143ab7be 800 800
dl prod-3 1612817288484-6f916006741a 800 800
dl prod-4 1556228720-195a672e8a03 800 800
dl prod-5 1600428877878-1a0fd85beda8 800 800
dl prod-6 1598440947619-2c35fc9aa908 800 800

dl esp-1 1494790108377-be9c29b29330 600 700
dl esp-2 1573496359142-b8d87734a5a2 600 700
dl esp-3 1531123897727-8f129e1688ce 600 700
dl esp-4 1544005313-94ddf0286df2   600 700
dl esp-5 1438761681033-6461ffad8d80 600 700
dl esp-6 1594824476967-48c8b964273f 600 700

dl local-1 1540555700478-4be289fbecef 1200 800
dl local-2 1560750588-73207b1ef5b8   1200 800

echo "Listo: $DIR"
