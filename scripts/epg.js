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
        eventDurationInQuants: function(event) {
            return (event.stop - event.start)/60/15;
        }
    }
}

Vue.component("event", {
    mixins: [ mixin ],
    props: [ "event" ],
    computed: {
        eventDuration() {
            return this.eventDurationInQuants(this.event);
        },
        startTime() {
            startDate = new Date(this.event.start * 1000);
            return this.formatTime(startDate);
        },
        endTime() {
            endDate = new Date(this.event.stop * 1000);
            return this.formatTime(endDate);
        }
    },
    template: `
        <td :colspan="eventDuration">
            {{ event.title }}<br/>
            {{ startTime }}/{{ endTime }}
        </td>
    `
})

Vue.component("channel", {
    mixins: [ mixin ],
    props: [ "channel", "fillTime" ],
    data() {
        return {
            events: []
        }
    },
    methods: {
        channelTimeDuration() {
            var duration = 0;
            for (var i = 0; i < this.events.length; i++) {
                duration += this.eventDurationInQuants(this.events[i]);
            }
            this.$emit("channelDuration", duration);
            return duration;
        }
    },
    computed: {
        remainingDuration() {
            if (this.fillTime - this.channelTimeDuration() > 0)
                return this.fillTime - this.channelTimeDuration();
            return 0;
        },
    },
    mounted() {
        axios
          .get("/api/epg/events/grid_limit_5_channel_" + this.channel.uuid)
          .then(response => (this.events = response.data.entries))
    },
    template: `
        <tr>
            <th>{{ channel.name }}</th>
            <event v-for="event in events" :key="event.eventId" :event="event">
            </event>
            <td :colspan="remainingDuration" v-if="remainingDuration > 0"></td>
        </tr>
    `
})

Vue.component("epg", {
    mixins: [ mixin ],
    data() {
        return {
            channels: [],
            maxChannelDuration: 0
        }
    },
    methods: {
        onChannelDuration(duration) {
            if (duration > this.maxChannelDuration) {
                this.maxChannelDuration = duration;
            }
        }
    },
    mounted() {
        axios
          .get("/api/channel/grid")
          .then(response => (this.channels = response.data.entries))
    },
    template: `
        <table>
            <channel v-for="channel in channels" :key="channel.uuid" :channel="channel" :fillTime="maxChannelDuration" @channelDuration="onChannelDuration">
            </channel>
        </table>
    `
})

app = new Vue({
    el: "#epg",
})


