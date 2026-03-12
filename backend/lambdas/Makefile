# Makefile for esm-live Lambda management.
#
# copy-wheels  — copy the latest skillstore_base wheel into every Lambda's lib/
#                dir (required before building Docker images or deploying).
#
# Usage:
#   make copy-wheels         # propagate wheel from canonical source Lambda
#   make copy-wheels SOURCE=esm-live-add-skill-content

WHEEL_GLOB  := lib/skillstore_base-*.whl
SOURCE      ?= esm-live-add-skill-content

# All Lambda directories (auto-discovered).
LAMBDAS := $(shell ls -d esm-live-*)

.PHONY: copy-wheels
copy-wheels:
	@echo "Source wheel: $(SOURCE)/lib/"
	@rm -f $(SOURCE)/lib/skillstore_base-*.whl; \
	cp $$(ls -t ../libs/skillstore-base/dist/skillstore_base-*.whl | head -1) $(SOURCE)/lib/; \
	WHEEL=$$(ls $(SOURCE)/lib/skillstore_base-*.whl 2>/dev/null | head -1); \
	if [ -z "$$WHEEL" ]; then \
		echo "ERROR: no skillstore_base wheel found in $(SOURCE)/lib/"; \
		exit 1; \
	fi; \
	echo "Wheel: $$WHEEL"; \
	for dir in $(LAMBDAS); do \
		if [ "$$dir" = "$(SOURCE)" ]; then continue; fi; \
		mkdir -p $$dir/lib; \
		rm -f $$dir/lib/skillstore_base-*.whl; \
		cp "$$WHEEL" $$dir/lib/; \
		echo "  -> $$dir/lib/"; \
	done; \
	echo "Done."
