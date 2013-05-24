Detention API
-------------

Provides an API for flagging incidents and for viewing the aggregate of flagged
incidents.

Endpoints:

* `/api/flag`: accepts a token and unique for the flagged incident. If the
  token is valid, the inicident is recorded as being flagged.

* `/api/unflag`: accepts a token and corresponding id for the flagged incident being
  unflagged. If the token is valid, the inicident is recorded as being unflagged. 

* `/api/flagged`: returns json summarising the aggregate of the all the
  flaggings made. Each flagged event is given a weight beteween 0 and 1. The
  weights are also randomly adjusted to promote exploration of different
  events.

TODO
=====
