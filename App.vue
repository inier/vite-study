<template>
	<div>
		<h1>{{ name }}</h1>
		{{ count }}
		<button @click="add">add</button>
	</div>
</template>

<script>
export default {
	name: 'App',
	data() {
		return {
			name: '18zili',
			count: 0,
		};
	},
	methods: {
		add() {
			this.count++;
		},
	},
};
</script>

<style>
#app {
	font-family: 'Courier New', Courier, monospace;
}
</style>
