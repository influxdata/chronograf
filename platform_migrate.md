# Migrate code to Plaform

### Cherry pick commits onto `platform-migrate` branch in 1.X chronograf

```sh
git checkout platform-migrate
git cherry-pick <sha>
```

### Push those to origin in chrongoraf

```sh
git push origin platform-migrate 
```

### Cherry pick commit from `platform-migrate` branch onto branch in platform

If this is the first time you are doing this you'll need to add chronograf as a remote
platform.

```sh
git remote add chronograf git@github.com:influxdata/chronograf.git
```

If not, just fetch the remotely added chrongoraf.
```sh
git fetch chronograf
```

And then
```sh
git checkout -b cherry/<pick a name>
git cherry-pick <sha from platform-migrate>
git push origin cherry/<pick a name>
```

### Open PR.

Use the github.