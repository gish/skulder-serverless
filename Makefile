.PHONY: all
all:
	cd src/entries-getter && make
	cd src/entry-writer && make
