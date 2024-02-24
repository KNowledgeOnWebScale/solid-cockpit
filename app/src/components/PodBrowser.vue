<template>
    <div id="read" class="panel">
      <div class="row">
        <form id="writeForm">
          <label id="writelabel" for="input_name">Choose File</label>
          <input
            type="file"
            id="input_name"
            name="name"
            size="50"
            placeholder="Your name here"
          />
          <button type="submit">
            Upload
          </button>
        </form>
      </div>
    </div>
    
</template>



<script lang="ts">
import { uploadFile } from './fileUpload';

export default {
  name: 'YourComponent',
  methods: {
    async handleFileUpload(event: Event) {
      event.preventDefault();
      const fileInput = this.$refs.fileInput as HTMLInputElement;
      const file = fileInput.files?.item(0);
      if (!file) {
        alert('No file selected');
        return;
      }
      await uploadFile(file);
    },
  },
}




</script>