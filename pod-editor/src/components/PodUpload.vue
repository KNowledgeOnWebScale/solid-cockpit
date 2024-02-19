<template>
    <div>
      <h2>Upload Data</h2>
      <input type="file" @change="handleFileUpload">
      <button @click="upload">Upload</button>
    </div>
</template>

<script lang="ts">
  import { Component } from 'vue';
  
  // @Component
  export default class UploadComponent {
    file: File | null = null;
  
    handleFileUpload(event: any) {
      this.file = event.target.files[0];
    }
  
    upload() {
      if (this.file) {
        // Your upload logic here
      } else {
        alert('Please select a file to upload');
      }
    }
  }
</script>