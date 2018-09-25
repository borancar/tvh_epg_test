var mixin = {
    methods: {
        formatTime: function(time) {
            var hours = time.getHours();
            var minutes = time.getMinutes();
        
            var temp = "";
            temp += (hours < 10 ? "0" : "") + hours;
            temp += (minutes < 10 ? ":0" : ":") + minutes;
            return temp;
        },
        durationInQuants: function(seconds) {
            return Math.round(seconds/60/15);
        }
    }
}

Vue.component("event", {
    mixins: [ mixin ],
    props: [ "event", "startTime", "endTime" ],
    computed: {
        eventDuration() {
            return this.durationInQuants(this.endTime - this.startTime);
        },
        realStartTime() {
            startDate = new Date(this.event.start * 1000);
            return this.formatTime(startDate);
        },
        realEndTime() {
            endDate = new Date(this.event.stop * 1000);
            return this.formatTime(endDate);
        }
    },
    template: `
        <td :colspan="eventDuration">
            {{ event.title }}<br/>
            {{ realStartTime }}/{{ realEndTime }}
        </td>
    `
})

Vue.component("channel", {
    mixins: [ mixin ],
    props: [ "channel", "startTime", "endTime" ],
    data() {
        return {
            events: []
        }
    },
    computed: {
        leftFill() {
            var earliestEvent = this.endTime;
            for (var i = 0; i < this.events.length; i++) {
                if (this.events[i].start < earliestEvent) {
                    earliestEvent = this.events[i].start;
                }
            }

            if (earliestEvent < this.startTime) {
                return 0;
            } else {
                return this.durationInQuants(earliestEvent - this.startTime);
            }
        },
        rightFill() {
            var latestEnd = this.startTime;
            for (var i = 0; i < this.events.length; i++) {
                if (this.events[i].stop > latestEnd) {
                    latestEnd = this.events[i].stop;
                }
            }

            if (latestEnd > this.endTime) {
                return 0;
            } else if (latestEnd == this.startTime) {
                // left fill will cover it all
                return 0;
            } else {
                return this.durationInQuants(this.endTime - latestEnd);
            }
        }
    },
    methods: {
        eventVisible(event) {

            if (event.start >= this.startTime &&
                event.start < this.endTime) {
                return true;
            }

            if (event.stop > this.startTime &&
                event.stop <= this.endTime) {
                return true;
            }

            if (event.start < this.startTime &&
                event.stop > this.endTime) {
                return true;
            }

            return false;
        }
    },
    mounted() {
        axios
          .get("/api/epg/events/grid_limit_5_channel_" + this.channel.uuid)
          .then(response => (this.events = response.data.entries))
    },
    template: `
        <tr>
            <th>{{ channel.name }}</th>
            <td :colspan="leftFill" v-if="leftFill > 0"></td>
            <event v-for="event in events" :key="event.eventId" :event="event" :startTime="Math.max(event.start, startTime)" :endTime="Math.min(event.stop, endTime)" v-if="eventVisible(event)">
            </event>
            <td :colspan="rightFill" v-if="rightFill > 0"></td>
        </tr>
    `
})

Vue.component("epg", {
    props: [ "startTime", "endTime" ],
    mixins: [ mixin ],
    data() {
        return {
            channels: [],
        }
    },
    mounted() {
        axios
          .get("/api/channel/grid")
          .then(response => (this.channels = response.data.entries))
    },
    template: `
        <table>
            <channel v-for="channel in channels" :key="channel.uuid" :channel="channel" :startTime="startTime" :endTime="endTime">
            </channel>
        </table>
    `
})

app = new Vue({
    el: "#epg",
})


