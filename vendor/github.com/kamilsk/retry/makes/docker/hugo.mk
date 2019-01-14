HUGO_SITE ?= html
HUGO_PORT ?= 8080
HUGO_HOST ?= localhost:$(HUGO_PORT)

.PHONY: hugo-pull
hubo-pull:                    #| Pulls kamilsk/hugo docker image.
	docker pull kamilsk/hugo:latest

.PHONY: hugo-init
hugo-init:                    #| Inits new Hugo site structure.
                              #| Accepts: HUGO_SITE.
	mkdir -p site/$(HUGO_SITE)/archetypes \
	         site/$(HUGO_SITE)/content \
	         site/$(HUGO_SITE)/data \
	         site/$(HUGO_SITE)/i18n \
	         site/$(HUGO_SITE)/layouts \
	         site/$(HUGO_SITE)/static \
	         site/$(HUGO_SITE)/themes
	for file in $$(ls site/$(HUGO_SITE)); do \
	    if [[ -d site/$(HUGO_SITE)/$$file ]]; then \
	        export COUNT=$$(ls -a site/$(HUGO_SITE)/$$file | wc -l); \
	        if [[ $$COUNT -lt 3 ]]; then \
	            touch site/$(HUGO_SITE)/$$file/.gitkeep; \
	        fi; \
	    fi; \
	done;
	if ! [ -e site/$(HUGO_SITE)/config.yml ]; then \
	    touch site/$(HUGO_SITE)/config.yml; \
	    echo 'baseURL:        https://$(HUGO_SITE)/' >> site/$(HUGO_SITE)/config.yml; \
	    echo 'metaDataFormat: yaml'                  >> site/$(HUGO_SITE)/config.yml; \
	fi;

.PHONY: hugo-themes
hugo-themes:                  #| Loads all available official themes for Hugo.
	git clone --depth 1 --recursive https://github.com/spf13/hugoThemes.git themes

.PHONY: hugo-site
hugo-site:                    #| Executes `hugo new site`.
                              #| Accepts: HUGO_SITE.
                              #| Uses: CWD.
	docker run --rm \
	    -v '$(CWD)/site':/usr/share \
	    -w /usr/share \
	    kamilsk/hugo:latest \
	    hugo new site $(HUGO_SITE)

.PHONY: hugo-theme
hugo-theme:                   #| Executes `hugo new theme`.
                              #| Accepts: HUGO_SITE, THEME.
                              #| Uses: CWD.
	docker run --rm \
	    -v '$(CWD)/site/$(HUGO_SITE)':/usr/share/site \
	    kamilsk/hugo:latest \
	    hugo new theme $(THEME)

.PHONY: hugo-content
hugo-content:                 #| Executes `hugo new`.
                              #| Accepts: HUGO_SITE, CONTENT.
                              #| Uses: CWD.
	docker run --rm \
	    -v '$(CWD)/site/$(HUGO_SITE)':/usr/share/site \
	    kamilsk/hugo:latest \
	    hugo new $(CONTENT).md

.PHONY: hugo-mount
hugo-mount:                   #| Mounts site directory and runs docker container with Hugo in interactive mode.
                              #| Accepts: HUGO_SITE, HUGO_HOST, HUGO_PORT.
                              #| Uses: CWD.
	docker run --rm -it \
	    -v '$(CWD)/site/$(HUGO_SITE)':/usr/share/site \
	    -p $(HUGO_HOST):$(HUGO_PORT) \
	    -e PORT=$(HUGO_PORT) \
	    -e BASE_URL='http://$(HUGO_HOST)' \
	    kamilsk/hugo:latest /bin/sh

.PHONY: hugo-start
hugo-start:                   #| Starts docker container with site on Hugo.
                              #| Accepts: HUGO_SITE, HUGO_HOST, HUGO_PORT, ARGS.
                              #| Uses: CWD.
	docker run --rm -d \
	    --name hugo-$(HUGO_SITE) \
	    -v '$(CWD)/site/$(HUGO_SITE)':/usr/share/site \
	    -p $(HUGO_HOST):$(HUGO_PORT) \
	    -e PORT=$(HUGO_PORT) \
	    -e BASE_URL='http://$(HUGO_HOST)' \
	    -e ARGS='$(strip $(ARGS))' \
	    kamilsk/hugo:latest

.PHONY: hugo-stop
hugo-stop:                    #| Stops docker container with site on Hugo.
                              #| Accepts: HUGO_SITE.
	docker stop hugo-$(HUGO_SITE)

.PHONY: hugo-logs
hugo-logs:                    #| Shows logs in docker container with site on Hugo.
                              #| Accepts: HUGO_SITE.
	docker logs -f hugo-$(HUGO_SITE)
