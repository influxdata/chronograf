PRUNE_AVAILABLE := $(shell echo "1.13.0\n$(DOCKER_VERSION)" | sort -ct. -k1,1n -k2,2n && echo true)

.PHONY: docker-clean
docker-clean: docker-clean-invalid-common
docker-clean: docker-clean-invalid-exp
docker-clean: docker-clean-invalid-golang
docker-clean: docker-clean-invalid-tools
docker-clean:                 #| Removes all invalid docker images (common, golang, kamilsk/go-experiments|tools).
                              #| Accepts: PRUNE.
                              #| Uses: PRUNE_AVAILABLE.
	if [ ! -z '${PRUNE}' ] && [ '${PRUNE_AVAILABLE}' == 'true' ]; then docker system prune $(strip $(PRUNE)); fi

.PHONY: docker-clean-invalid-common
docker-clean-invalid-common:  #| Removes all invalid common docker images.
	docker images --all \
	| grep '^<none>\s\+' \
	| awk '{print $$3}' \
	| xargs docker rmi -f &>/dev/null || true

.PHONY: docker-clean-invalid-exp
docker-clean-invalid-exp:     #| Removes all invalid kamilsk/go-experiments docker images.
	docker images --all \
	| grep '^kamilsk\/go-experiments\s\+' \
	| awk '{print $$2 "\t" $$3}' \
	| grep '^<none>\s\+' \
	| awk '{print $$2}' \
	| xargs docker rmi -f &>/dev/null || true

.PHONY: docker-clean-invalid-golang
docker-clean-invalid-golang:  #| Removes all invalid golang docker images.
	docker images --all \
	| grep '^golang\s\+' \
	| awk '{print $$2 "\t" $$3}' \
	| grep '^<none>\s\+' \
	| awk '{print $$2}' \
	| xargs docker rmi -f &>/dev/null || true

.PHONY: docker-clean-invalid-tools
docker-clean-invalid-tools:   #| Removes all invalid kamilsk/go-tools docker images.
	docker images --all \
	| grep '^kamilsk\/go-tools\s\+' \
	| awk '{print $$2 "\t" $$3}' \
	| grep '^<none>\s\+' \
	| awk '{print $$2}' \
	| xargs docker rmi -f &>/dev/null || true
