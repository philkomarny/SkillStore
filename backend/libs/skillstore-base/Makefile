# Makefile for skillstore_base library.
#
# all        — install, build wheel, copy to all Lambda lib/ dirs
# install    — poetry install
# build      — poetry build (wheel + sdist)
# copylib    — copy wheel to every esm-live Lambda's lib/ dir, removing stale wheels
# clean      — remove dist/ and stale wheels from Lambda lib/ dirs

LAMBDA_DIR := ../../lambdas
WHEEL_NAME := skillstore_base
DIST_DIR   := dist

.PHONY: all install build copylib clean

all: install build copylib

install:
	poetry install

build:
	rm -rf $(DIST_DIR)
	poetry build

copylib:
	@WHEEL=$$(ls $(DIST_DIR)/$(WHEEL_NAME)-*.whl 2>/dev/null | sort -V | tail -1); \
	if [ -z "$$WHEEL" ]; then \
		echo "ERROR: no $(WHEEL_NAME) wheel found in $(DIST_DIR)/"; \
		exit 1; \
	fi; \
	echo "Wheel: $$WHEEL"; \
	for dir in $(LAMBDA_DIR)/esm-live-*/; do \
		mkdir -p "$$dir/lib"; \
		rm -f "$$dir/lib/$(WHEEL_NAME)-"*.whl; \
		cp "$$WHEEL" "$$dir/lib/"; \
		echo "  -> $$dir/lib/"; \
	done; \
	echo "Done. Copied to $$(ls -d $(LAMBDA_DIR)/esm-live-*/ | wc -l | tr -d ' ') Lambda(s)."

clean:
	rm -rf $(DIST_DIR)
	@for dir in $(LAMBDA_DIR)/esm-live-*/; do \
		rm -f "$$dir/lib/$(WHEEL_NAME)-"*.whl; \
	done; \
	echo "Cleaned dist/ and all Lambda lib/ wheels."
